import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Star, Clock, Globe, Play, Download, Share2, Copy, Users,
  Eye, DollarSign, TrendingUp, ExternalLink, ChevronLeft, AlertCircle
} from 'lucide-react'
import { supabase, TMDB_IMG, SITE_URL, timeAgo, formatCurrency } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function MoviePage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const toast = useToast()

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total_visitors: 0, qualified_visitors: 0, pending_earnings: 0, available_earnings: 0, total_earnings: 0 })
  const [statsLoading, setStatsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetchMovie()
  }, [slug])

  useEffect(() => {
    if (movie) {
      trackReferral()
      checkOwnership()
    }
  }, [movie, user, profile])

  async function fetchMovie() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()

    if (fetchError || !data) {
      setError('Movie not found or has been removed.')
      setLoading(false)
      return
    }
    setMovie(data)
    setLoading(false)
  }

  function checkOwnership() {
    if (!user || !movie) return
    const owner = user.id === movie.owner_id
    setIsOwner(owner)
    if (owner && profile) {
      setShareUrl(`${SITE_URL}/movie/${movie.slug}?ref=${profile.referral_id}`)
    }
  }

  async function trackReferral() {
    const ref = searchParams.get('ref')
    if (!ref || !movie) return

    try {
      await supabase.rpc('track_referral', {
        p_movie_id: movie.id,
        p_referral_id: ref,
        p_visitor_ip: null
      }).then(async () => {
        const visitorData = {
          movie_id: movie.id,
          referral_id: ref,
          page_views: 1,
          qualified: false
        }
        await supabase.from('referral_visits').insert(visitorData).then(() => {}).catch(() => {})
      }).catch(() => {})
    } catch (e) {
      // silent fail for referral tracking
    }
  }

  useEffect(() => {
    if (isOwner && movie) {
      fetchStats()
    }
  }, [isOwner, movie])

  async function fetchStats() {
    if (!movie) return
    setStatsLoading(true)
    try {
      const { data: visits } = await supabase
        .from('referral_visits')
        .select('page_views, qualified')
        .eq('movie_id', movie.id)

      const totalVisitors = (visits || []).reduce((sum, v) => sum + (v.page_views || 0), 0)
      const qualifiedVisitors = (visits || []).filter(v => v.qualified).length
      const pendingEarnings = qualifiedVisitors * 0.20

      setStats({
        total_visitors: totalVisitors,
        qualified_visitors: qualifiedVisitors,
        pending_earnings: movie.pending_earnings || 0,
        available_earnings: movie.available_earnings || 0,
        total_earnings: movie.total_earnings || 0
      })
    } catch (e) {
      // fallback to movie data
      setStats({
        total_visitors: movie.total_visitors || 0,
        qualified_visitors: movie.qualified_visitors || 0,
        pending_earnings: movie.pending_earnings || 0,
        available_earnings: movie.available_earnings || 0,
        total_earnings: movie.total_earnings || 0
      })
    }
    setStatsLoading(false)
  }

  function getShareText() {
    return `Check out "${movie.title}" (${movie.release_year}) on ShareFlix!\n\n${movie.description ? movie.description.substring(0, 150) + '...' : ''}\n\n${shareUrl || `${SITE_URL}/movie/${movie.slug}`}`
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(getShareText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareTelegram() {
    const text = encodeURIComponent(getShareText())
    const url = encodeURIComponent(shareUrl || `${SITE_URL}/movie/${movie.slug}`)
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
  }

  function shareFacebook() {
    const url = encodeURIComponent(shareUrl || `${SITE_URL}/movie/${movie.slug}`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  function shareTwitter() {
    const text = encodeURIComponent(`Check out "${movie.title}" (${movie.release_year}) on ShareFlix!`)
    const url = encodeURIComponent(shareUrl || `${SITE_URL}/movie/${movie.slug}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  async function copyLink() {
    const link = shareUrl || `${SITE_URL}/movie/${movie.slug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({
        title: `${movie.title} (${movie.release_year})`,
        text: getShareText(),
        url: shareUrl || `${SITE_URL}/movie/${movie.slug}`
      }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ width: '100%', height: 400 }} />
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="skeleton" style={{ width: '60%', height: 32, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '40%', height: 20, marginBottom: 20 }} />
          <div className="skeleton" style={{ width: '100%', height: 120 }} />
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="page">
        <div className="container" style={{ paddingTop: 60, textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--text-muted)" />
          <h2 style={{ marginTop: 16 }}>{error || 'Movie not found'}</h2>
          <Link to="/movies" className="btn btn-primary" style={{ marginTop: 20 }}>
            <ChevronLeft size={16} /> Browse Movies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Helmet>
        <title>{movie.title} ({movie.release_year}) - ShareFlix</title>
        <meta name="description" content={movie.description ? movie.description.substring(0, 160) : `Watch ${movie.title} on ShareFlix`} />
        <meta property="og:title" content={`${movie.title} (${movie.release_year}) - ShareFlix`} />
        <meta property="og:description" content={movie.description ? movie.description.substring(0, 160) : `Watch ${movie.title} on ShareFlix`} />
        {movie.poster_path && <meta property="og:image" content={`${TMDB_IMG}/w780${movie.poster_path}`} />}
        <meta property="og:type" content="video.movie" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${movie.title} (${movie.release_year}) - ShareFlix`} />
        {movie.backdrop_path && <meta name="twitter:image" content={`${TMDB_IMG}/w1280${movie.backdrop_path}`} />}
      </Helmet>

      {/* Hero backdrop */}
      <div style={{ position: 'relative', minHeight: 400, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: movie.backdrop_path
            ? `url(${TMDB_IMG}/w1280${movie.backdrop_path})`
            : movie.poster_path
              ? `url(${TMDB_IMG}/w780${movie.poster_path})`
              : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center top'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, var(--bg-primary) 10%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.8) 100%)'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, alignItems: 'flex-end', paddingTop: 200, paddingBottom: 40 }}>
          {/* Poster */}
          <img
            src={movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : '/no-poster.png'}
            alt={movie.title}
            style={{ width: 180, borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', flexShrink: 0 }}
          />

          {/* Title area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>{movie.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {movie.release_year && <span>{movie.release_year}</span>}
              {movie.runtime > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {movie.vote_average > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" /> {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.original_language && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe size={14} /> {movie.original_language.toUpperCase()}
                </span>
              )}
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {movie.genres.map((g, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 40 }}>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {movie.watch_url && (
            <a href={movie.watch_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              <Play size={18} /> Watch Now
            </a>
          )}
          {movie.download_url && (
            <a href={movie.download_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
              <Download size={18} /> Download
            </a>
          )}
        </div>

        {/* Owner Stats Section */}
        {isOwner && profile && (
          <div className="card" style={{ padding: 24, marginBottom: 32, border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(229,9,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Your Movie — Share & Earn</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Share your personal link and earn rewards</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid-2" style={{ marginBottom: 20, gap: 12 }}>
              <div className="stat-card">
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={20} color="var(--info)" />
                  {statsLoading ? '...' : stats.total_visitors}
                </div>
                <div className="stat-label">Total Visitors</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="var(--success)" />
                  {statsLoading ? '...' : stats.qualified_visitors}
                </div>
                <div className="stat-label">Qualified Visitors</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="var(--warning)" />
                  {statsLoading ? '...' : formatCurrency(stats.pending_earnings)}
                </div>
                <div className="stat-label">Pending Earnings</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={20} color="var(--accent)" />
                  {statsLoading ? '...' : formatCurrency(stats.available_earnings)}
                </div>
                <div className="stat-label">Available Earnings</div>
              </div>
            </div>

            {/* Total earnings */}
            <div className="stat-card" style={{ marginBottom: 20 }}>
              <div className="stat-value" style={{ fontSize: 28, color: 'var(--success)' }}>
                {statsLoading ? '...' : formatCurrency(stats.total_earnings)}
              </div>
              <div className="stat-label">Total Earnings</div>
            </div>

            {/* Personal share link */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Your Personal Share Link</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  value={shareUrl}
                  readOnly
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                />
                <button className="btn btn-primary" onClick={copyLink}>
                  <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Share this link on WhatsApp, Telegram, or anywhere. You earn ₹0.20 for each qualified visitor.
              </p>
            </div>
          </div>
        )}

        {/* Movie Details */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>About This Movie</h2>

          {movie.description && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>
              {movie.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {movie.director && (
              <div>
                <div className="form-label">Director</div>
                <div style={{ fontSize: 14 }}>{movie.director}</div>
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div>
                <div className="form-label">Cast</div>
                <div style={{ fontSize: 14 }}>{movie.cast.join(', ')}</div>
              </div>
            )}
            {movie.original_language && (
              <div>
                <div className="form-label">Language</div>
                <div style={{ fontSize: 14 }}>{movie.original_language}</div>
              </div>
            )}
            {movie.quality && (
              <div>
                <div className="form-label">Quality</div>
                <div style={{ fontSize: 14 }}>{movie.quality}</div>
              </div>
            )}
            {movie.subtitles && (
              <div>
                <div className="form-label">Subtitles</div>
                <div style={{ fontSize: 14 }}>{movie.subtitles}</div>
              </div>
            )}
            {movie.runtime > 0 && (
              <div>
                <div className="form-label">Runtime</div>
                <div style={{ fontSize: 14 }}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</div>
              </div>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share2 size={20} /> Share This Movie
          </h2>
          <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={shareWhatsApp}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button className="share-btn telegram" onClick={shareTelegram}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012.056 0h-.112zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </button>
            <button className="share-btn facebook" onClick={shareFacebook}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button className="share-btn twitter" onClick={shareTwitter}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter
            </button>
            <button className="share-btn copy" onClick={copyLink}>
              <Copy size={18} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {navigator.share && (
              <button className="share-btn" onClick={nativeShare} style={{ background: 'var(--bg-card-hover)' }}>
                <Share2 size={18} />
                Share
              </button>
            )}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <Link to="/movies" className="btn btn-outline">
            <ChevronLeft size={16} /> Back to Movies
          </Link>
        </div>
      </div>
    </div>
  )
}
