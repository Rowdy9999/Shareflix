import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search as SearchIcon, Star, Film, X } from 'lucide-react'
import { supabase, TMDB_IMG } from '../lib/supabase'

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Adventure', 'Fantasy', 'Crime', 'Mystery', 'Documentary']
const YEARS = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']
const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi']
const QUALITIES = ['All', '4K', '1080p', '720p', '480p']

function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie.slug}`} className="movie-card card">
      <img
        className="poster"
        src={movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : '/no-poster.png'}
        alt={movie.title}
        loading="lazy"
      />
      <div className="info">
        <div className="title">{movie.title}</div>
        <div className="meta">
          <span>{movie.release_year || 'N/A'}</span>
          {movie.vote_average > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {movie.vote_average.toFixed(1)}
            </span>
          )}
          {movie.quality && <span>{movie.quality}</span>}
        </div>
      </div>
      {movie.is_featured && <span className="badge">Featured</span>}
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="movie-card card">
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
      <div style={{ padding: 10 }}>
        <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '50%', height: 12 }} />
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All')
  const [year, setYear] = useState(searchParams.get('year') || 'All')
  const [language, setLanguage] = useState(searchParams.get('language') || 'All')
  const [quality, setQuality] = useState(searchParams.get('quality') || 'All')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    const g = searchParams.get('genre')
    const y = searchParams.get('year')
    const l = searchParams.get('language')
    const qf = searchParams.get('quality')
    if (q || g || y || l || qf) {
      fetchMovies()
    }
  }, [searchParams])

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (genre !== 'All') params.set('genre', genre)
    if (year !== 'All') params.set('year', year)
    if (language !== 'All') params.set('language', language)
    if (quality !== 'All') params.set('quality', quality)
    setSearchParams(params)
  }

  function handleFilterChange(type, value) {
    const params = new URLSearchParams(searchParams)
    if (value === 'All') {
      params.delete(type)
    } else {
      params.set(type, value)
    }
    setSearchParams(params)

    switch (type) {
      case 'genre': setGenre(value); break
      case 'year': setYear(value); break
      case 'language': setLanguage(value); break
      case 'quality': setQuality(value); break
    }
  }

  async function fetchMovies() {
    setLoading(true)
    setSearched(true)

    const q = searchParams.get('q') || ''
    const g = searchParams.get('genre') || 'All'
    const y = searchParams.get('year') || 'All'
    const l = searchParams.get('language') || 'All'
    const qf = searchParams.get('quality') || 'All'

    let query = supabase.from('movies').select('*', { count: 'exact' }).eq('status', 'approved')

    if (q.trim()) {
      query = query.ilike('title', `%${q.trim()}%`)
    }
    if (g !== 'All') {
      query = query.contains('genres', [g])
    }
    if (y !== 'All') {
      query = query.eq('release_year', parseInt(y))
    }
    if (l !== 'All') {
      query = query.ilike('original_language', l)
    }
    if (qf !== 'All') {
      query = query.eq('quality', qf)
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data, count: total, error } = await query

    if (!error) {
      setMovies(data || [])
      setCount(total || 0)
    }
    setLoading(false)
  }

  function clearFilters() {
    setSearchQuery('')
    setGenre('All')
    setYear('All')
    setLanguage('All')
    setQuality('All')
    setSearchParams({})
    setMovies([])
    setCount(0)
    setSearched(false)
  }

  const hasActiveFilters = searchQuery || genre !== 'All' || year !== 'All' || language !== 'All' || quality !== 'All'

  return (
    <div className="page">
      <Helmet>
        <title>Search Movies - ShareFlix</title>
      </Helmet>

      <div className="container" style={{ paddingTop: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Search Movies</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIcon
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                className="form-input"
                type="text"
                placeholder="Search by movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              <SearchIcon size={18} />
            </button>
          </div>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Genre tabs */}
          <div className="tabs" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {GENRES.map((g) => (
              <button
                key={g}
                className={`tab ${genre === g ? 'active' : ''}`}
                onClick={() => handleFilterChange('genre', g)}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Secondary filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-input"
              value={year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              style={{ width: 'auto', minWidth: 110 }}
            >
              {YEARS.map((y) => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <select
              className="form-input"
              value={language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              style={{ width: 'auto', minWidth: 130 }}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>)}
            </select>
            <select
              className="form-input"
              value={quality}
              onChange={(e) => handleFilterChange('quality', e.target.value)}
              style={{ width: 'auto', minWidth: 110 }}
            >
              {QUALITIES.map((q) => <option key={q} value={q}>{q === 'All' ? 'All Qualities' : q}</option>)}
            </select>

            {hasActiveFilters && (
              <button
                className="btn btn-outline btn-sm"
                onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {searched && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            {count} movie{count !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Movies grid */}
        {loading ? (
          <div className="grid-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            {searched ? (
              <>
                <Film size={48} />
                <h3 style={{ marginTop: 12 }}>No movies found</h3>
                <p>Try adjusting your filters or search query.</p>
                <button className="btn btn-outline" onClick={clearFilters} style={{ marginTop: 12 }}>
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <SearchIcon size={48} />
                <h3 style={{ marginTop: 12 }}>Search for movies</h3>
                <p>Enter a title or use the filters above to find movies.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid-4">
            {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}
