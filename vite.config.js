import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://csgqdmyuacaqjbkutwog.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__aq7CY46fCXpPc22IuFukA__Jh4npen'),
    'import.meta.env.VITE_TMDB_API_KEY': JSON.stringify(process.env.VITE_TMDB_API_KEY || ''),
  }
})
