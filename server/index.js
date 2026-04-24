import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  buildGeminiCaptionPrompt,
  GEMINI_VIDEO_DESCRIPTION_PROMPT,
} from './gemini-caption-prompts.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '127.0.0.1'
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024
const CONVERSION_TTL_MS = 30 * 60 * 1000
const GEMINI_INLINE_VIDEO_LIMIT_BYTES = 100 * 1024 * 1024
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const GEMINI_VIDEO_FPS = Number(process.env.GEMINI_VIDEO_FPS ?? 4)
const convertedVideos = new Map()

function setCorsHeaders(req, res) {
  const origin = req.headers.origin ?? '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-File-Name')
  res.setHeader('Vary', 'Origin')
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res)
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

async function readRequestBody(req) {
  const chunks = []
  let totalBytes = 0

  for await (const chunk of req) {
    totalBytes += chunk.length

    if (totalBytes > MAX_UPLOAD_BYTES) {
      const error = new Error('GIF uploads are limited to 30 MB.')
      error.statusCode = 413
      throw error
    }

    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      '-vf',
      'scale=ceil(iw/2)*2:ceil(ih/2)*2',
      '-movflags',
      'faststart',
      '-pix_fmt',
      'yuv420p',
      '-an',
      '-c:v',
      'libx264',
      outputPath,
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let stderr = ''

    ffmpeg.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    ffmpeg.on('error', (error) => {
      reject(error)
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      const error = new Error(stderr.trim() || `ffmpeg exited with code ${code}.`)
      error.statusCode = 500
      reject(error)
    })
  })
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload.gif'
}

export async function convertGifToMp4Buffer(body, fileName) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'gifgiggle-'))
  const inputFileName = sanitizeFileName(fileName)
  const inputPath = path.join(tempDir, inputFileName.endsWith('.gif') ? inputFileName : `${inputFileName}.gif`)
  const outputBaseName = path.parse(inputPath).name || 'converted'
  const outputPath = path.join(tempDir, `${outputBaseName}.mp4`)

  try {
    await writeFile(inputPath, body)
    await runFfmpeg(inputPath, outputPath)

    return { tempDir, outputPath, outputFileName: path.basename(outputPath) }
  } catch (error) {
    await rm(tempDir, { force: true, recursive: true })
    throw error
  }
}

async function handleConvertGif(req, res) {
  const contentType = String(req.headers['content-type'] ?? '')
  const fileName = decodeURIComponent(String(req.headers['x-file-name'] ?? 'upload.gif'))

  if (!contentType.startsWith('image/gif')) {
    sendJson(req, res, 415, { message: 'Only GIF uploads are supported.' })
    return
  }

  const body = await readRequestBody(req)

  if (body.length === 0) {
    sendJson(req, res, 400, { message: 'Upload a GIF file before converting.' })
    return
  }

  const { tempDir, outputPath, outputFileName } = await convertGifToMp4Buffer(body, fileName)
  const outputStats = await stat(outputPath)
  const videoId = randomUUID()

  convertedVideos.set(videoId, {
    createdAt: Date.now(),
    filePath: outputPath,
    fileName: outputFileName,
    mimeType: 'video/mp4',
    sizeBytes: outputStats.size,
    tempDir,
  })

  sendJson(req, res, 200, {
    convertedFileName: outputFileName,
    message: 'GIF converted to MP4 successfully.',
    mimeType: 'video/mp4',
    sizeBytes: outputStats.size,
    videoId,
    videoUrl: `/api/converted-media/${videoId}`,
  })
}

async function handleGetConvertedMedia(req, res, videoId) {
  const video = convertedVideos.get(videoId)

  if (!video) {
    sendJson(req, res, 404, { message: 'Converted video not found or has expired.' })
    return
  }

  setCorsHeaders(req, res)
  res.writeHead(200, {
    'Cache-Control': 'private, max-age=1800',
    'Content-Length': video.sizeBytes,
    'Content-Type': video.mimeType,
    'Content-Disposition': `inline; filename="${video.fileName}"`,
  })

  createReadStream(video.filePath).pipe(res)
}

async function cleanupExpiredVideos() {
  const cutoff = Date.now() - CONVERSION_TTL_MS

  await Promise.all(
    [...convertedVideos.entries()].map(async ([videoId, video]) => {
      if (video.createdAt >= cutoff) return

      convertedVideos.delete(videoId)
      await rm(video.tempDir, { force: true, recursive: true })
    })
  )
}

async function readJsonBody(req) {
  const bodyBuffer = await readRequestBody(req)

  if (bodyBuffer.length === 0) {
    return {}
  }

  try {
    return JSON.parse(bodyBuffer.toString('utf8'))
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.statusCode = 400
    throw error
  }
}

async function callGeminiForVideoCaption(video) {
  if (!GEMINI_API_KEY) {
    const error = new Error('Set GEMINI_API_KEY on the server before generating captions.')
    error.statusCode = 500
    throw error
  }

  if (video.sizeBytes > GEMINI_INLINE_VIDEO_LIMIT_BYTES) {
    const error = new Error(
      'The converted MP4 is too large for the inline Gemini path in this POC. Switch this route to the Gemini Files API for larger videos.'
    )
    error.statusCode = 413
    throw error
  }

  const videoBytes = await readFile(video.filePath)
  const videoDescription = await callGeminiForVideoDescription(video, videoBytes)
  const captions = await callGeminiForTextCaptions(videoDescription)

  return { captions, videoDescription }
}

function extractCaptionText(responseBody) {
  const parts = responseBody?.candidates?.[0]?.content?.parts

  if (!Array.isArray(parts)) {
    return ''
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n')
    .trim()
}

async function callGeminiForVideoDescription(video, videoBytes) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: video.mimeType,
              data: videoBytes.toString('base64'),
            },
            videoMetadata: {
              fps: GEMINI_VIDEO_FPS,
            },
          },
          {
            text: GEMINI_VIDEO_DESCRIPTION_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1200,
      temperature: 0.2,
    },
  }

  const data = await makeGeminiRequest(payload, 'Gemini could not describe this video.')
  const description = extractCaptionText(data)

  if (!description) {
    const error = new Error('Gemini returned no video description.')
    error.statusCode = 502
    throw error
  }

  return description
}

async function callGeminiForTextCaptions(videoDescription) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildGeminiCaptionPrompt(videoDescription),
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.8,
    },
  }

  const data = await makeGeminiRequest(payload, 'Gemini could not write a caption.')
  const captionText = extractCaptionText(data)

  if (!captionText) {
    const error = new Error('Gemini returned no caption text.')
    error.statusCode = 502
    throw error
  }

  const captions = extractCaptions(captionText)

  if (captions.length === 0) {
    const error = new Error('Gemini returned no usable captions.')
    error.statusCode = 502
    throw error
  }

  return captions.slice(0, 3)
}

function extractCaptions(captionText) {
  return captionText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .map((line) => line.replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
}

async function makeGeminiRequest(payload, fallbackMessage) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error?.message ?? fallbackMessage
    const error = new Error(message)
    error.statusCode = response.status
    throw error
  }

  return data
}

async function handleGenerateCaptions(req, res) {
  const body = await readJsonBody(req)
  const videoId = typeof body.videoId === 'string' ? body.videoId : ''
  const video = convertedVideos.get(videoId)

  if (!videoId) {
    sendJson(req, res, 400, { message: 'A converted videoId is required.' })
    return
  }

  if (!video) {
    sendJson(req, res, 404, { message: 'Converted video not found or has expired.' })
    return
  }

  const { captions, videoDescription } = await callGeminiForVideoCaption(video)

  sendJson(req, res, 200, {
    captions: captions.map((caption, index) => ({
      id: `gemini-${videoId}-${index + 1}`,
      content: caption,
    })),
    videoDescription,
    model: GEMINI_MODEL,
  })
}

export function createApiServer() {
  return createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendJson(req, res, 400, { message: 'Invalid request.' })
        return
      }

      await cleanupExpiredVideos()

      if (req.method === 'OPTIONS') {
        setCorsHeaders(req, res)
        res.writeHead(204)
        res.end()
        return
      }

      const url = new URL(req.url, `http://${req.headers.host ?? `localhost:${PORT}`}`)

      if (req.method === 'GET' && url.pathname === '/api/health') {
        sendJson(req, res, 200, { status: 'ok' })
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/convert-gif-to-mp4') {
        await handleConvertGif(req, res)
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/generate-captions') {
        await handleGenerateCaptions(req, res)
        return
      }

      if (req.method === 'GET' && url.pathname.startsWith('/api/converted-media/')) {
        const videoId = url.pathname.replace('/api/converted-media/', '')
        await handleGetConvertedMedia(req, res, videoId)
        return
      }

      sendJson(req, res, 404, { message: 'Route not found.' })
    } catch (error) {
      const statusCode = error?.statusCode ?? 500

      sendJson(req, res, statusCode, {
        message:
          error?.code === 'ENOENT'
            ? 'ffmpeg is not installed on the server.'
            : error instanceof Error
              ? error.message
              : 'Unable to convert the GIF right now.',
      })
    }
  })
}

export function startApiServer({ host = HOST, port = PORT } = {}) {
  const server = createApiServer()

  server.listen(port, host, () => {
    console.log(`GifGiggle API listening on http://${host}:${port}`)
  })

  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startApiServer()
}
