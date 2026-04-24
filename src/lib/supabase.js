import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

const googleClientId =
  import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  import.meta.env.VITE_GOOGLE_CLIENT_ID

const siteUrl =
  import.meta.env.NEXT_PUBLIC_SITE_URL ?? import.meta.env.VITE_SITE_URL

let browserClient

export function getSupabaseConfigError() {
  const missing = []

  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!googleClientId) missing.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID')

  if (missing.length === 0) return null

  return `Missing environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`
}

export function getGoogleClientId() {
  return googleClientId
}

export function getSupabaseSiteUrl() {
  if (siteUrl) return siteUrl

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:5173'
}

export function getSupabaseBrowserClient() {
  if (getSupabaseConfigError()) return null

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
      },
    })
  }

  return browserClient
}
