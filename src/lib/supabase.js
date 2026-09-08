import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://csgqdmyuacaqjbkutwog.supabase.co'
const supabaseAnonKey = 'sb_publishable__aq7CY46fCXpPc22IuFukA__Jh4npen'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''
export const TMDB_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMG = 'https://image.tmdb.org/t/p'
export const SITE_URL = window.location.origin

export async function searchTMDB(query) {
  if (!TMDB_API_KEY) return []
  try {
    const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`)
    const data = await res.json()
    return data.results || []
  } catch { return [] }
}

export async function getTMDBMovie(tmdbId) {
  if (!TMDB_API_KEY) return null
  try {
    const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`)
    return await res.json()
  } catch { return null }
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`
}
