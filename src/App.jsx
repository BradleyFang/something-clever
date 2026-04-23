import { useState } from 'react'
import './App.css'

const captionIdeas = [
  'When the group chat says this will be a quick decision.',
  'Me acting casual while the loading spinner judges my life choices.',
  'POV: the demo worked once and now everyone expects a miracle.',
]

function App() {
  const [gifName, setGifName] = useState('')

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

      <section className="caption-preview" id="captions" aria-labelledby="caption-heading">
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

      <section className="steps-section" id="how-it-works" aria-labelledby="steps-heading">
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

export default App
