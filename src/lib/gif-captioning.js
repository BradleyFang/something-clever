function getContentType(file) {
  if (file.type) return file.type

  if (file.name.toLowerCase().endsWith('.gif')) {
    return 'image/gif'
  }

  return ''
}

async function parseApiResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json()
  }

  let message = fallbackMessage

  try {
    const body = await response.json()
    message = body.message ?? fallbackMessage
  } catch {
    // Keep the fallback message when the response is not JSON.
  }

  throw new Error(message)
}

export async function convertGifToMp4(file) {
  const contentType = getContentType(file)

  if (contentType !== 'image/gif') {
    throw new Error('Please upload a GIF file.')
  }

  const response = await fetch('/api/convert-gif-to-mp4', {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'X-File-Name': encodeURIComponent(file.name || 'upload.gif'),
    },
    body: file,
  })

  return parseApiResponse(response, 'Unable to convert your GIF to MP4.')
}

export async function generateCaptionsForGif(videoId) {
  const response = await fetch('/api/generate-captions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoId }),
  })

  return parseApiResponse(response, 'Unable to generate captions from the converted MP4.')
}
