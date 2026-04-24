# GifGiggle

This Vite app now uses the same Google login method as `funnystudy`: Supabase OAuth with Google, passing the Google `client_id` explicitly and letting Supabase manage the browser session.

## Setup

1. Copy `.env.example` to `.env` and fill in:

```bash
GEMINI_API_KEY=...
# Optional
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VIDEO_FPS=4
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:5173
```

2. In Supabase, enable Google OAuth and add your redirect URL.

For local Vite development that should usually be:

```text
http://localhost:5173/auth/callback
```

3. Install and run:

```bash
npm install
npm run server
npm run dev
```

4. Install `ffmpeg` on the machine that runs the server.

On macOS with Homebrew:

```bash
brew install ffmpeg
```

## Notes

- `vite.config.js` accepts both `VITE_*` and `NEXT_PUBLIC_*` env names so this app can share the same auth variable naming as the Next.js project.
- The Next.js app uses server routes and middleware for auth cookies. This Vite app uses the browser Supabase client instead, which is the equivalent approach for a single-page frontend.
- GIF-to-MP4 conversion now runs through `server/index.js` on port `3001`. During local development, Vite proxies `/api/*` to that server.
- Caption generation now sends the converted MP4 to Gemini from the server. This first pass uses inline video data up to 100 MB; move to the Gemini Files API for larger videos.
