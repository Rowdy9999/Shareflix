import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Star, Clock, TrendingUp, Share2, DollarSign, ChevronRight, Film } from 'lucide-react'
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
          {movie.genres && movie.genres[0] && <span>{movie.genres[0]}</span>}
        </div>
      </div>
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

function SectionSkeleton() {
  return (
    <div className="grid-4">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [popular, setPopular] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const [heroMovies, setHeroMovies] = useState([])

  useEffect(() => {
    fetchMovies()
  }, [])

  useEffect(() => {
    if (heroMovies.length === 0) return
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroMovies.length])

  async function fetchMovies() {
    setLoading(true)

    const [featuredRes, latestRes, popularRes, recentRes] = await Promise.all([
      supabase.from('movies')
        .select('*')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('total_earnings', { ascending: false })
        .limit(6),
      supabase.from('movies')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('movies')
        .select('*')
        .eq('status', 'approved')
        .order('total_earnings', { ascending: false })
        .limit(8),
      supabase.from('movies')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8)
    ])

    setFeatured(featuredRes.data || [])
    setLatest(latestRes.data || [])
    setPopular(popularRes.data || [])
    setRecentlyAdded(recentRes.data || [])
    setHeroMovies(featuredRes.data?.slice(0, 5) || latestRes.data?.slice(0, 5) || [])
    setLoading(false)
  }

  const heroMovie = heroMovies[heroIndex]

  return (
    <div className="page">
      <Helmet>
        <title>ShareFlix - Movie Discovery & Earn</title>
        <meta name="description" content="Discover movies, share with friends, and earn rewards on ShareFlix." />
        <meta property="og:title" content="ShareFlix - Movie Discovery & Earn" />
        <meta property="og:description" content="Discover movies, share with friends, and earn rewards on ShareFlix." />
      </Helmet>

      {/* Hero */}
      <section style={{
        position: 'relative',
        minHeight: 420,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 32
      }}>
        {heroMovie && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: heroMovie.backdrop_path
              ? `url(${TMDB_IMG}/w1280${heroMovie.backdrop_path})`
              : heroMovie.poster_path
                ? `url(${TMDB_IMG}/w780${heroMovie.poster_path})`
                : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'blur(6px)',
            transform: 'scale(1.1)',
            opacity: 0.35
          }} />
        )}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.6) 100%)'
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '60px 16px' }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, marginBottom: 12, maxWidth: 560 }}>
            Discover & Share Movies.<br />
            <span style={{ color: 'var(--accent)' }}>Earn Rewards.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 480 }}>
            Browse thousands of movies, share with friends, and earn money for every qualified visit.
          </p>
          <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 20px', width: '100%', maxWidth: 420, color: 'var(--text-muted)', fontSize: 15 }}>
            <Search size={18} /> Search movies...
          </Link>
        </div>
      </section>

      <div className="container">
        {/* Featured */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Featured Movies</h2>
            <Link to="/movies" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? <SectionSkeleton /> : featured.length === 0 ? (
            <div className="empty-state"><Film size={48} /><p>No featured movies yet</p></div>
          ) : (
            <div className="grid-4">
              {featured.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>

        {/* Latest */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Latest Movies</h2>
            <Link to="/movies" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? <SectionSkeleton /> : latest.length === 0 ? (
            <div className="empty-state"><Film size={48} /><p>No movies yet</p></div>
          ) : (
            <div className="grid-4">
              {latest.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>

        {/* Popular */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Popular Movies</h2>
            <Link to="/movies" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? <SectionSkeleton /> : popular.length === 0 ? (
            <div className="empty-state"><TrendingUp size={48} /><p>No popular movies yet</p></div>
          ) : (
            <div className="grid-4">
              {popular.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>

        {/* Recently Added */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recently Added</h2>
            <Link to="/movies" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? <SectionSkeleton /> : recentlyAdded.length === 0 ? (
            <div className="empty-state"><Clock size={48} /><p>No recently added movies</p></div>
          ) : (
            <div className="grid-4">
              {recentlyAdded.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>

        {/* Share & Earn */}
        <section className="section" style={{ paddingBottom: 40 }}>
          <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(229,9,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={28} color="var(--accent)" />
              </div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={28} color="var(--success)" />
              </div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Share & Earn Money</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Submit movies you love, share your unique link with friends, and earn ₹0.20 for every qualified visitor who watches the trailer. The more you share, the more you earn!
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/movies" className="btn btn-secondary btn-lg">Browse Movies</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
