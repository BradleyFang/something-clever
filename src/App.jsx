import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  getGoogleClientId,
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  getSupabaseSiteUrl,
} from './lib/supabase'
import { convertGifToMp4, generateCaptionsForGif } from './lib/gif-captioning'

function App() {
  const [gifName, setGifName] = useState('')
  const [selectedGif, setSelectedGif] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('')
  const [convertedVideoId, setConvertedVideoId] = useState('')
  const [captions, setCaptions] = useState([])
  const [generationStatus, setGenerationStatus] = useState('idle')
  const [generationMessage, setGenerationMessage] = useState('')
  const [route, setRoute] = useState(() => getCurrentRoute())
  const [resultGifUrl, setResultGifUrl] = useState('')
  const [session, setSession] = useState(null)
  const [authMessage, setAuthMessage] = useState(() => readAuthMessageFromUrl())
  const [authStatus, setAuthStatus] = useState(() =>
    getSupabaseConfigError() ? 'ready' : 'loading'
  )
  const supabase = getSupabaseBrowserClient()
  const authConfigError = getSupabaseConfigError()
  const previewRequestIdRef = useRef(0)

  useEffect(() => {
    if (!supabase) return

    let isActive = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isActive) return

      if (error) {
        setAuthMessage('Unable to load your session. Please try again.')
      }

      setSession(data.session ?? null)
      if (data.session) clearAuthParams()
      setAuthStatus('ready')
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return

      setSession(nextSession ?? null)
      if (nextSession) {
        setAuthMessage('')
        clearAuthParams()
      }
      setAuthStatus('ready')
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handlePopState = () => {
      setRoute(getCurrentRoute())
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl)
      }
      if (resultGifUrl) {
        URL.revokeObjectURL(resultGifUrl)
      }
    }
  }, [resultGifUrl, uploadPreviewUrl])

  const handleGoogleSignIn = async () => {
    if (!supabase || authConfigError) return

    setAuthMessage('')

    const redirectTo = new URL('/auth/callback', getSupabaseSiteUrl()).toString()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          client_id: getGoogleClientId(),
        },
      },
    })

    if (error) {
      setAuthMessage('Unable to sign in right now. Please try again.')
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthMessage('Unable to sign out right now. Please try again.')
      return
    }

    setSession(null)
  }

  const handleGifSelection = async (event) => {
    const file = event.target.files?.[0] ?? null
    const previewRequestId = previewRequestIdRef.current + 1

    previewRequestIdRef.current = previewRequestId

    setUploadPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }

      return file ? URL.createObjectURL(file) : ''
    })
    setSelectedGif(file)
    setGifName(file?.name ?? '')
    setGenerationMessage('')
    setCaptions([])
    setConvertedVideoId('')

    if (!file) {
      setGenerationStatus('idle')
      return
    }

    if (file.type && file.type !== 'image/gif') {
      setGenerationStatus('error')
      setGenerationMessage('Please choose a GIF file before generating captions.')
      return
    }

    setGenerationStatus('loading')
    setGenerationMessage('Preparing your GIF for caption generation.')

    try {
      const conversion = await convertGifToMp4(file)

      if (previewRequestId !== previewRequestIdRef.current) {
        return
      }

      setConvertedVideoId(conversion.videoId ?? '')
      setGenerationStatus('idle')
      setGenerationMessage('GIF preview ready.')
    } catch (error) {
      if (previewRequestId !== previewRequestIdRef.current) {
        return
      }

      setGenerationStatus('error')
      setGenerationMessage(
        error instanceof Error ? error.message : 'Unable to convert your GIF to MP4.'
      )
    }
  }

  const runCaptionPipeline = async (gifFile) => {
    if (!gifFile) {
      setGenerationStatus('error')
      setGenerationMessage('Upload a GIF first.')
      return
    }

    if (!convertedVideoId) {
      setGenerationStatus('error')
      setGenerationMessage('Wait for the GIF preview to finish loading first.')
      return
    }

    setGenerationStatus('loading')
    setGenerationMessage('Asking Gemini to caption the converted MP4.')

    try {
      const captionResult = await generateCaptionsForGif(convertedVideoId)
      const generatedCaptions = Array.isArray(captionResult.captions)
        ? captionResult.captions
        : []

      setCaptions(
        generatedCaptions.map((caption, index) => ({
          id: caption.id ?? `${caption.content}-${index}`,
          content: caption.content ?? 'No caption text returned.',
        }))
      )
      const nextResultGifUrl = URL.createObjectURL(gifFile)
      if (resultGifUrl) {
        URL.revokeObjectURL(resultGifUrl)
      }
      setResultGifUrl(nextResultGifUrl)
      setGenerationStatus('success')
      setGenerationMessage(
        `Caption generated with ${captionResult.model ?? 'Gemini'}.`
      )
      navigateTo('/results', setRoute)
    } catch (error) {
      setGenerationStatus('error')
      setGenerationMessage(
        error instanceof Error
          ? error.message
          : 'Gemini video captioning is not available yet.'
      )
      setCaptions([])
    }
  }

  const handleGenerateCaptions = async () => {
    await runCaptionPipeline(selectedGif)
  }

  const handleCopyCaption = async (caption) => {
    try {
      await navigator.clipboard.writeText(caption)
      setGenerationStatus('success')
      setGenerationMessage('Caption copied to clipboard.')
    } catch {
      setGenerationStatus('error')
      setGenerationMessage('Unable to copy the caption.')
    }
  }

  if (authStatus === 'loading') {
    return (
      <main className="auth-shell">
        <section className="auth-panel auth-panel-loading" aria-live="polite">
          <p className="eyebrow">Secure entrance</p>
          <h1>Loading your login state.</h1>
          <p className="hero-text">
            Checking Supabase for an active Google session before the app renders.
          </p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-grid">
            <div className="auth-copy">
              <p className="eyebrow">GifGiggle access</p>
              <h1>Sign in with Google to open the caption lab.</h1>
              <p className="hero-text">
                This uses the same Supabase Google OAuth approach as the other
                project, adapted for a Vite single-page app.
              </p>
              <div className="auth-preview">
                <span>Google OAuth via Supabase</span>
                <span>PKCE session handling</span>
                <span>Same NEXT_PUBLIC env names</span>
              </div>
            </div>

            <div className="auth-card">
              <p className="section-kicker">Authentication</p>
              <h2>Continue with your Google account.</h2>
              <p className="auth-note">
                Configure the Supabase URL, anon key, and Google client ID, then
                use the button below.
              </p>
              <button
                className="google-auth-button"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={Boolean(authConfigError)}
              >
                <span className="google-auth-icon">
                  <GoogleIcon />
                </span>
                Sign in with Google
              </button>
              <p className="message-banner" aria-live="polite">
                {authConfigError ?? authMessage ?? ' '}
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const userLabel =
    session.user.user_metadata?.full_name ?? session.user.email ?? 'Signed in'

  if (route === '/results') {
    return (
      <ResultsPage
        captions={captions}
        gifName={gifName}
        resultGifUrl={resultGifUrl}
        userLabel={userLabel}
        onBack={() => navigateTo('/', setRoute)}
        onCopyCaption={handleCopyCaption}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <main className="page-shell">
      <nav className="nav-bar" aria-label="Primary">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/', setRoute)
          }}
        >
          <span className="brand-mark">G</span>
          GifGiggle
        </a>
        <div className="nav-links" aria-label="Page sections">
          <a href="#upload">Upload</a>
          <a href="#upload">Generate</a>
        </div>
        <div className="nav-actions">
          <span className="user-chip">{userLabel}</span>
          <button className="logout-button" type="button" onClick={handleSignOut}>
            Log out
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Caption lab for moving memes</p>
          <h1>Drop in a GIF. Generate captions on the next page.</h1>
          <p className="hero-text">
            Upload a GIF here, run caption generation, and then review the
            output on a dedicated result screen.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#upload">
              Upload a GIF
            </a>
            <a className="secondary-action" href="#upload">
              Generate captions
            </a>
          </div>
        </div>

        <section className="generator-card" id="upload" aria-label="GIF upload">
          <div className="card-header">
            <span className="status-pill">{getStatusPillLabel(generationStatus)}</span>
            <span>{getCardHeaderLabel(generationStatus, captions.length)}</span>
          </div>

          <label className="drop-zone">
            <input
              type="file"
              accept="image/gif"
              onChange={handleGifSelection}
            />
            <span className="upload-icon" aria-hidden="true">
              GIF
            </span>
            <span className="drop-title">Upload your GIF</span>
            <span className="drop-hint">
              {gifName || 'Drag a loop here, or browse from your device'}
            </span>
          </label>

          {uploadPreviewUrl ? (
            <div className="upload-preview-card">
              <p className="section-kicker">GIF preview</p>
              <div className="upload-preview-frame">
                <img
                  className="upload-preview-image"
                  src={uploadPreviewUrl}
                  alt="Uploaded GIF preview"
                />
              </div>
            </div>
          ) : null}

          <button
            className="generate-button"
            type="button"
            onClick={handleGenerateCaptions}
            disabled={generationStatus === 'loading' || !convertedVideoId}
          >
            {getGenerateButtonLabel(generationStatus, Boolean(uploadPreviewUrl))}
          </button>

          <p className={`generation-banner generation-banner-${generationStatus}`} aria-live="polite">
            {generationMessage || ' '}
          </p>
        </section>
      </section>
    </main>
  )
}

function ResultsPage({
  captions,
  resultGifUrl,
  userLabel,
  onBack,
  onCopyCaption,
  onSignOut,
}) {
  const hasResults = resultGifUrl && captions.length > 0

  return (
    <main className="results-page-shell">
      <nav className="nav-bar" aria-label="Primary">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onBack()
          }}
        >
          <span className="brand-mark">G</span>
          GifGiggle
        </a>
        <div className="nav-actions">
          <span className="user-chip">{userLabel}</span>
          <button className="logout-button" type="button" onClick={onSignOut}>
            Log out
          </button>
        </div>
      </nav>

      <section className="results-page">
        <div className="results-toolbar">
          <button className="secondary-action" type="button" onClick={onBack}>
            Back to upload
          </button>
        </div>

        {hasResults ? (
          <div className="results-layout">
            <article className="result-gif-card">
              <p className="section-kicker">Uploaded GIF</p>
              <div className="result-gif-frame">
                <img className="result-gif" src={resultGifUrl} alt="Uploaded GIF" />
              </div>
            </article>

            <section className="result-captions-panel" aria-labelledby="result-captions-heading">
              <p className="section-kicker">Generated captions</p>
              <h2 id="result-captions-heading">Caption output</h2>
              <div className="caption-grid">
                {captions.map((caption, index) => (
                  <article className="caption-card" key={getCaptionKey(caption, index)}>
                    <span>Option {index + 1}</span>
                    <p>{getCaptionContent(caption)}</p>
                    <button
                      type="button"
                      onClick={() => onCopyCaption(getCaptionContent(caption))}
                    >
                      Copy caption
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="results-empty">
            <p className="section-kicker">No result yet</p>
            <h1>Generate a caption first.</h1>
            <p className="hero-text">
              Upload a GIF on the landing page and press generate to see the GIF
              and its captions here.
            </p>
            <button className="primary-action" type="button" onClick={onBack}>
              Go to upload
            </button>
          </section>
        )}
      </section>
    </main>
  )
}

function clearAuthParams() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const authKeys = ['code', 'state', 'error', 'error_code', 'error_description']
  let changed = false

  authKeys.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  })

  if (!changed) return

  const nextUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, '', nextUrl || '/')
}

function readAuthMessageFromUrl() {
  if (typeof window === 'undefined') return ''

  const params = new URL(window.location.href).searchParams
  return params.get('error_description') ?? params.get('error') ?? ''
}

function getCaptionContent(caption) {
  return typeof caption === 'string' ? caption : caption.content
}

function getCaptionKey(caption, index) {
  if (typeof caption === 'string') return `${caption}-${index}`
  return caption.id ?? `${caption.content}-${index}`
}

function getStatusPillLabel(status) {
  if (status === 'loading') return 'Converting GIF'
  if (status === 'success') return 'Live results'
  if (status === 'error') return 'Check input'
  return 'Ready'
}

function getCardHeaderLabel(status, captionCount) {
  if (status === 'loading') return 'Preparing GIF preview'
  if (status === 'success') {
    return captionCount > 0 ? `${captionCount} captions generated` : 'GIF preview ready'
  }
  if (status === 'error') return 'Fix the issue and try again'
  return 'Upload a GIF to start'
}

function getCurrentRoute() {
  if (typeof window === 'undefined') return '/'

  return window.location.pathname === '/results' ? '/results' : '/'
}

function getGenerateButtonLabel(status, hasPreview) {
  if (status !== 'loading') return 'Generate captions'
  return hasPreview ? 'Preparing results...' : 'Converting preview...'
}

function navigateTo(path, setRoute) {
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }

  setRoute(path)
}

function GoogleIcon() {
  return (
    <svg
      className="google-logo"
      aria-hidden
      viewBox="0 0 24 24"
      focusable="false"
    >
      <defs>
        <linearGradient id="googleAmberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        fill="url(#googleAmberGradient)"
        d="M21.35 11.1h-9.17v2.92h5.32c-.24 1.36-1.44 4-5.32 4-3.2 0-5.81-2.66-5.81-5.94 0-3.28 2.61-5.94 5.81-5.94 1.82 0 3.04.77 3.74 1.44l2.55-2.46C16.94 3.5 14.75 2.5 12 2.5 6.98 2.5 3 6.48 3 11.5S6.98 20.5 12 20.5c6.15 0 8.5-4.33 8.5-7.41 0-.5-.05-.89-.15-1.99Z"
      />
    </svg>
  )
}

export default App
