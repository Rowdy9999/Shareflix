import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Film, CheckCircle, Clock, XCircle, Eye, DollarSign, Users, TrendingUp, Plus, ExternalLink, Copy, BarChart3 } from 'lucide-react'
import { supabase, TMDB_IMG, SITE_URL, formatCurrency } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    total_submitted: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    total_visitors: 0,
    total_earnings: 0,
    available_balance: 0
  })
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)

    const { data: userMovies } = await supabase
      .from('movies')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    const allMovies = userMovies || []

    const approved = allMovies.filter(m => m.status === 'approved')
    const pending = allMovies.filter(m => m.status === 'pending')
    const rejected = allMovies.filter(m => m.status === 'rejected')

    const totalVisitors = allMovies.reduce((sum, m) => sum + (m.total_visitors || 0), 0)
    const totalEarnings = allMovies.reduce((sum, m) => sum + (m.total_earnings || 0), 0)
    const availableBalance = allMovies.reduce((sum, m) => sum + (m.available_earnings || 0), 0)

    setStats({
      total_submitted: allMovies.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      total_visitors: totalVisitors,
      total_earnings: totalEarnings,
      available_balance: availableBalance
    })

    setMovies(allMovies)
    setLoading(false)
  }

  function copyShareLink(movie) {
    const link = `${SITE_URL}/movie/${movie.slug}?ref=${profile?.referral_id || ''}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Share link copied!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  function getStatusBadge(status) {
    const styles = {
      approved: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', icon: <CheckCircle size={13} /> },
      pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: <Clock size={13} /> },
      rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: <XCircle size={13} /> }
    }
    const s = styles[status] || styles.pending
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        fontSize: 12,
        fontWeight: 600
      }}>
        {s.icon} {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <Helmet>
          <title>Dashboard - ShareFlix</title>
        </Helmet>
        <div className="container" style={{ padding: '32px 16px' }}>
          <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 32 }} />
          <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '40%', height: 14 }} />
              </div>
            ))}
          </div>
          <div className="skeleton" style={{ width: '100%', height: 300 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Helmet>
        <title>Dashboard - ShareFlix</title>
      </Helmet>
      <div className="container" style={{ padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Welcome back, {profile?.username || user?.email}
            </p>
          </div>
          <Link to="/submit" className="btn btn-primary">
            <Plus size={16} /> Submit Movie
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Film size={20} color="#6366f1" />
              </div>
              {stats.total_submitted}
            </div>
            <div className="stat-label">Movies Submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#22c55e" />
              </div>
              {stats.approved}
            </div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#f59e0b" />
              </div>
              {stats.pending}
            </div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={20} color="#ef4444" />
              </div>
              {stats.rejected}
            </div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={20} color="#0ea5e9" />
              </div>
              {stats.total_visitors.toLocaleString()}
            </div>
            <div className="stat-label">Total Visitors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={20} color="#22c55e" />
              </div>
              {formatCurrency(stats.total_earnings)}
            </div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>

        {/* Available Balance Highlight */}
        <div className="card" style={{ padding: 24, marginBottom: 32, borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Available Balance</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(stats.available_balance)}</div>
            </div>
            <Link to="/wallet" className="btn btn-primary">
              <DollarSign size={16} /> Withdraw
            </Link>
          </div>
        </div>

        {/* My Movies Table */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} /> My Movies
          </h2>

          {movies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Film size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>No movies submitted yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Submit your first movie to start earning rewards</p>
              <Link to="/submit" className="btn btn-primary">
                <Plus size={16} /> Submit Movie
              </Link>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movie</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visitors</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qualified</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Earnings</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie) => (
                    <tr
                      key={movie.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => navigate(`/movie/${movie.slug}`)}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `${TMDB_IMG}/w92${movie.poster_path}`) : '/no-poster.png'}
                            alt={movie.title}
                            style={{ width: 40, height: 56, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{movie.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{movie.release_year || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{getStatusBadge(movie.status)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14 }}>
                        {(movie.total_visitors || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14 }}>
                        {(movie.qualified_visitors || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
                        {formatCurrency(movie.total_earnings || 0)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                          {movie.status === 'approved' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => copyShareLink(movie)}
                              title="Copy share link"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          <Link
                            to={`/movie/${movie.slug}`}
                            className="btn btn-outline btn-sm"
                            title="View movie"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
