import { useEffect, useState } from 'react'
import './App.css'
import {
  getGoogleClientId,
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  getSupabaseSiteUrl,
} from './lib/supabase'

const captionIdeas = [
  'When the group chat says this will be a quick decision.',
  'Me acting casual while the loading spinner judges my life choices.',
  'POV: the demo worked once and now everyone expects a miracle.',
]

function App() {
  const [gifName, setGifName] = useState('')
  const [session, setSession] = useState(null)
  const [authMessage, setAuthMessage] = useState(() => readAuthMessageFromUrl())
  const [authStatus, setAuthStatus] = useState(() =>
    getSupabaseConfigError() ? 'ready' : 'loading'
  )
  const supabase = getSupabaseBrowserClient()
  const authConfigError = getSupabaseConfigError()

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

  return (
    <main className="page-shell">
      <nav className="nav-bar" aria-label="Primary">
        <a className="brand" href="/">
          <span className="brand-mark">G</span>
          GifGiggle
        </a>
        <div className="nav-links" aria-label="Page sections">
          <a href="#upload">Upload</a>
          <a href="#captions">Captions</a>
          <a href="#how-it-works">How it works</a>
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
          <h1>Drop in a GIF. Walk away with three caption angles.</h1>
          <p className="hero-text">
            A playful front door for turning a reaction GIF into punchlines,
            alternate takes, and scroll-stopping social copy.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#upload">
              Try the mock flow
            </a>
            <a className="secondary-action" href="#captions">
              Preview outputs
            </a>
          </div>
        </div>

        <section className="generator-card" id="upload" aria-label="GIF upload">
          <div className="card-header">
            <span className="status-pill">UI preview</span>
            <span>3 captions queued</span>
          </div>

          <label className="drop-zone">
            <input
              type="file"
              accept="image/gif"
              onChange={(event) =>
                setGifName(event.target.files?.[0]?.name ?? '')
              }
            />
            <span className="upload-icon" aria-hidden="true">
              GIF
            </span>
            <span className="drop-title">Upload your GIF</span>
            <span className="drop-hint">
              {gifName || 'Drag a loop here, or browse from your device'}
            </span>
          </label>

          <div className="tone-row" aria-label="Caption tones">
            <button type="button">Dry</button>
            <button type="button">Chaotic</button>
            <button type="button">Work-safe</button>
          </div>

          <button className="generate-button" type="button">
            Generate 3 captions
          </button>
        </section>
      </section>

      <section
        className="caption-preview"
        id="captions"
        aria-labelledby="caption-heading"
      >
        <div>
          <p className="section-kicker">Output preview</p>
          <h2 id="caption-heading">Three ready-to-edit caption cards</h2>
        </div>
        <div className="caption-grid">
          {captionIdeas.map((caption, index) => (
            <article className="caption-card" key={caption}>
              <span>Option {index + 1}</span>
              <p>{caption}</p>
              <button type="button">Copy caption</button>
            </article>
          ))}
        </div>
      </section>

      <section
        className="steps-section"
        id="how-it-works"
        aria-labelledby="steps-heading"
      >
        <p className="section-kicker">Simple flow</p>
        <h2 id="steps-heading">Built for the real feature later</h2>
        <div className="steps-grid">
          <article>
            <strong>1</strong>
            <h3>Upload</h3>
            <p>Give the interface a GIF and a clear next action.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Pick tone</h3>
            <p>Let people steer the vibe before generation happens.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Choose caption</h3>
            <p>Show three outputs with quick copy affordances.</p>
          </article>
        </div>
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
