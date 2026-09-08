import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Star, Filter, Film, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, TMDB_IMG } from '../lib/supabase'

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

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Adventure', 'Fantasy', 'Crime', 'Mystery', 'Documentary']
const YEARS = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']
const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi']
const QUALITIES = ['All', '4K', '1080p', '720p', '480p']
const PAGE_SIZE = 16

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [count, setCount] = useState(0)

  const [genre, setGenre] = useState(searchParams.get('genre') || 'All')
  const [year, setYear] = useState(searchParams.get('year') || 'All')
  const [language, setLanguage] = useState(searchParams.get('language') || 'All')
  const [quality, setQuality] = useState(searchParams.get('quality') || 'All')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest')

  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    fetchMovies(true)
  }, [genre, year, language, quality, sortBy, page])

  async function fetchMovies(reset = false) {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase.from('movies').select('*', { count: 'exact' }).eq('status', 'approved')

    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`)
    }
    if (genre !== 'All') {
      query = query.contains('genres', [genre])
    }
    if (year !== 'All') {
      query = query.eq('release_year', parseInt(year))
    }
    if (language !== 'All') {
      query = query.ilike('original_language', language)
    }
    if (quality !== 'All') {
      query = query.eq('quality', quality)
    }

    switch (sortBy) {
      case 'popular':
        query = query.order('total_earnings', { ascending: false })
        break
      case 'rating':
        query = query.order('vote_average', { ascending: false })
        break
      case 'oldest':
        query = query.order('release_year', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, count: total, error } = await query.range(from, to)

    if (!error) {
      setMovies(data || [])
      setCount(total || 0)
      setHasMore((data || []).length === PAGE_SIZE)
    }
    setLoading(false)
  }

  function handleFilterChange(type, value) {
    const params = new URLSearchParams(searchParams)
    if (value === 'All') {
      params.delete(type)
    } else {
      params.set(type, value)
    }
    params.delete('page')
    setSearchParams(params)

    switch (type) {
      case 'genre': setGenre(value); break
      case 'year': setYear(value); break
      case 'language': setLanguage(value); break
      case 'quality': setQuality(value); break
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.delete('q')
    }
    params.delete('page')
    setSearchParams(params)
  }

  function handleSort(value) {
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    params.delete('page')
    setSearchParams(params)
    setSortBy(value)
  }

  function goToPage(newPage) {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage)
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="page">
      <Helmet>
        <title>Movies - ShareFlix</title>
        <meta name="description" content="Browse and discover movies on ShareFlix. Filter by genre, year, language and quality." />
      </Helmet>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Genre tabs */}
          <div className="tabs">
            {GENRES.map((g) => (
              <button key={g} className={`tab ${genre === g ? 'active' : ''}`} onClick={() => handleFilterChange('genre', g)}>
                {g}
              </button>
            ))}
          </div>

          {/* Secondary filters row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="form-input" value={year} onChange={(e) => handleFilterChange('year', e.target.value)} style={{ width: 'auto', minWidth: 100 }}>
              {YEARS.map((y) => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <select className="form-input" value={language} onChange={(e) => handleFilterChange('language', e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>)}
            </select>
            <select className="form-input" value={quality} onChange={(e) => handleFilterChange('quality', e.target.value)} style={{ width: 'auto', minWidth: 100 }}>
              {QUALITIES.map((q) => <option key={q} value={q}>{q === 'All' ? 'All Qualities' : q}</option>)}
            </select>
            <select className="form-input" value={sortBy} onChange={(e) => handleSort(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
              <option value="latest">Latest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {count} movie{count !== 1 ? 's' : ''} found
        </p>

        {/* Movies grid */}
        {loading ? (
          <div className="grid-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <Film size={48} />
            <h3 style={{ marginTop: 12 }}>No movies found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid-4">
            {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32, paddingBottom: 24 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
