import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  LayoutDashboard, Film, Users, Share2, Wallet, Settings, Search,
  CheckCircle, XCircle, Clock, Eye, Trash2, Star, StarOff,
  Ban, Check, X, DollarSign, AlertTriangle, Shield, BarChart3,
  ChevronDown, Loader2, ExternalLink, Edit2, Save
} from 'lucide-react'
import { supabase, formatCurrency, timeAgo } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings }
]

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    approved: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    active: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    suspended: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    paid: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    qualified: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' }
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20,
      background: s.bg, color: s.color, fontSize: 12, fontWeight: 600,
      textTransform: 'capitalize'
    }}>
      {status}
    </span>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{
        maxWidth: 500, width: '90%', padding: 24,
        borderRadius: 'var(--radius)', background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, activeUsers: 0, suspendedUsers: 0,
    totalMovies: 0, pendingMovies: 0, approvedMovies: 0, rejectedMovies: 0,
    totalVisitors: 0, qualifiedVisitors: 0,
    totalEarnings: 0, pendingEarnings: 0,
    totalWithdrawals: 0, paidWithdrawals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    const [
      usersRes, activeRes, suspendedRes,
      moviesRes, pendingRes, approvedRes, rejectedRes,
      earningsRes, withdrawalsRes, paidRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'suspended'),
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('movies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('movies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('movies').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('movies').select('total_visitors, qualified_visitors, total_earnings, pending_earnings'),
      supabase.from('withdrawals').select('id, amount, status'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'paid')
    ])

    const movies = earningsRes.data || []
    const wds = withdrawalsRes.data || []

    setStats({
      totalUsers: usersRes.count || 0,
      activeUsers: activeRes.count || 0,
      suspendedUsers: suspendedRes.count || 0,
      totalMovies: moviesRes.count || 0,
      pendingMovies: pendingRes.count || 0,
      approvedMovies: approvedRes.count || 0,
      rejectedMovies: rejectedRes.count || 0,
      totalVisitors: movies.reduce((s, m) => s + (m.total_visitors || 0), 0),
      qualifiedVisitors: movies.reduce((s, m) => s + (m.qualified_visitors || 0), 0),
      totalEarnings: movies.reduce((s, m) => s + (m.total_earnings || 0), 0),
      pendingEarnings: movies.reduce((s, m) => s + (m.pending_earnings || 0), 0),
      totalWithdrawals: wds.length,
      paidWithdrawals: paidRes.count || 0
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid-4" style={{ gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '40%', height: 14 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} value={stats.totalUsers} label="Total Users" color="#6366f1" />
        <StatCard icon={CheckCircle} value={stats.activeUsers} label="Active Users" color="#22c55e" />
        <StatCard icon={Ban} value={stats.suspendedUsers} label="Suspended Users" color="#ef4444" />
        <StatCard icon={Film} value={stats.totalMovies} label="Total Movies" color="#0ea5e9" />
      </div>
      <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon={Clock} value={stats.pendingMovies} label="Pending Movies" color="#f59e0b" />
        <StatCard icon={CheckCircle} value={stats.approvedMovies} label="Approved Movies" color="#22c55e" />
        <StatCard icon={XCircle} value={stats.rejectedMovies} label="Rejected Movies" color="#ef4444" />
        <StatCard icon={Eye} value={stats.totalVisitors.toLocaleString()} label="Total Visitors" color="#0ea5e9" />
      </div>
      <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} value={stats.qualifiedVisitors.toLocaleString()} label="Qualified Visitors" color="#6366f1" />
        <StatCard icon={DollarSign} value={formatCurrency(stats.totalEarnings)} label="Total Earnings" color="#22c55e" />
        <StatCard icon={DollarSign} value={formatCurrency(stats.pendingEarnings)} label="Pending Earnings" color="#f59e0b" />
        <StatCard icon={Wallet} value={`${stats.paidWithdrawals}/${stats.totalWithdrawals}`} label="Paid / Total Withdrawals" color="#0ea5e9" />
      </div>
    </div>
  )
}

function AdminMovies() {
  const { user } = useAuth()
  const toast = useToast()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchMovies() }, [statusFilter])

  async function fetchMovies() {
    setLoading(true)
    let query = supabase.from('movies').select('*, profiles:owner_id(username, email)').order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query.limit(100)
    setMovies(data || [])
    setLoading(false)
  }

  async function logAudit(action, details) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action,
      details
    })
  }

  async function approveMovie(movie) {
    setActionLoading(true)
    const { error } = await supabase.from('movies').update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    }).eq('id', movie.id)
    if (!error) {
      await logAudit('approve_movie', { movie_id: movie.id, title: movie.title })
      toast.success(`"${movie.title}" approved`)
      fetchMovies()
    } else {
      toast.error('Failed to approve movie')
    }
    setActionLoading(false)
  }

  function openReject(movie) {
    setModal({ type: 'reject', movie })
    setRejectReason('')
  }

  async function confirmReject() {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setActionLoading(true)
    const { error } = await supabase.from('movies').update({
      status: 'rejected',
      rejection_reason: rejectReason.trim()
    }).eq('id', modal.movie.id)
    if (!error) {
      await logAudit('reject_movie', { movie_id: modal.movie.id, title: modal.movie.title, reason: rejectReason.trim() })
      toast.success(`"${modal.movie.title}" rejected`)
      setModal(null)
      fetchMovies()
    } else {
      toast.error('Failed to reject movie')
    }
    setActionLoading(false)
  }

  async function deleteMovie(movie) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return
    setActionLoading(true)
    const { error } = await supabase.from('movies').delete().eq('id', movie.id)
    if (!error) {
      await logAudit('delete_movie', { movie_id: movie.id, title: movie.title })
      toast.success(`"${movie.title}" deleted`)
      fetchMovies()
    } else {
      toast.error('Failed to delete movie')
    }
    setActionLoading(false)
  }

  async function toggleFeature(movie) {
    setActionLoading(true)
    const { error } = await supabase.from('movies').update({
      is_featured: !movie.is_featured
    }).eq('id', movie.id)
    if (!error) {
      await logAudit('toggle_feature', { movie_id: movie.id, title: movie.title, is_featured: !movie.is_featured })
      toast.success(movie.is_featured ? 'Unfeatured' : 'Featured')
      fetchMovies()
    } else {
      toast.error('Failed to update')
    }
    setActionLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <Film size={48} />
          <p style={{ marginTop: 12 }}>No movies found</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movie</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={m.poster_path ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w92${m.poster_path}`) : '/no-poster.png'}
                        alt={m.title}
                        style={{ width: 36, height: 50, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                        {m.is_featured && <span style={{ fontSize: 11, color: '#f59e0b' }}>★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{m.profiles?.username || m.profiles?.email || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={m.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{timeAgo(m.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                      <a href={`/movie/${m.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" title="View">
                        <Eye size={14} />
                      </a>
                      {m.status !== 'approved' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} onClick={() => approveMovie(m)} disabled={actionLoading} title="Approve">
                          <Check size={14} />
                        </button>
                      )}
                      {m.status !== 'rejected' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => openReject(m)} disabled={actionLoading} title="Reject">
                          <X size={14} />
                        </button>
                      )}
                      <button className="btn btn-sm" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }} onClick={() => toggleFeature(m)} disabled={actionLoading} title={m.is_featured ? 'Unfeature' : 'Feature'}>
                        {m.is_featured ? <StarOff size={14} /> : <Star size={14} />}
                      </button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => deleteMovie(m)} disabled={actionLoading} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'reject' && (
        <Modal onClose={() => setModal(null)} title={`Reject "${modal.movie.title}"`}>
          <div className="form-group">
            <label className="form-label">Rejection Reason *</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmReject} disabled={actionLoading}>
              {actionLoading ? <><Loader2 size={16} className="spin" /> Processing...</> : 'Reject Movie'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminUsers() {
  const { user } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceNote, setBalanceNote] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (searchQuery.trim()) {
      query = query.or(`username.ilike.%${searchQuery.trim()}%,email.ilike.%${searchQuery.trim()}%`)
    }
    const { data: profiles } = await query.limit(100)

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id)
      const { data: movies } = await supabase.from('movies').select('owner_id, total_earnings, available_earnings').in('owner_id', userIds)
      const movieMap = {}
      ;(movies || []).forEach(m => {
        if (!movieMap[m.owner_id]) movieMap[m.owner_id] = { count: 0, earnings: 0, balance: 0 }
        movieMap[m.owner_id].count++
        movieMap[m.owner_id].earnings += m.total_earnings || 0
        movieMap[m.owner_id].balance += m.available_earnings || 0
      })
      const enriched = profiles.map(p => ({
        ...p,
        movieCount: movieMap[p.id]?.count || 0,
        totalEarnings: movieMap[p.id]?.earnings || 0,
        balance: movieMap[p.id]?.balance || 0
      }))
      setUsers(enriched)
    } else {
      setUsers([])
    }
    setLoading(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    fetchUsers()
  }

  async function logAudit(action, details) {
    await supabase.from('audit_logs').insert({ admin_id: user.id, action, details })
  }

  async function toggleSuspend(u) {
    const newStatus = u.account_status === 'suspended' ? 'active' : 'suspended'
    if (!confirm(`${newStatus === 'suspended' ? 'Suspend' : 'Unsuspend'} ${u.username || u.email}?`)) return
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ account_status: newStatus }).eq('id', u.id)
    if (!error) {
      await logAudit(newStatus === 'suspended' ? 'suspend_user' : 'unsuspend_user', { user_id: u.id, username: u.username })
      toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'unsuspended'}`)
      fetchUsers()
    } else {
      toast.error('Failed to update user')
    }
    setActionLoading(false)
  }

  function openBalanceModal(u) {
    setModal({ type: 'balance', user: u })
    setBalanceAmount('')
    setBalanceNote('')
  }

  async function adjustBalance() {
    const amount = parseFloat(balanceAmount)
    if (!amount) {
      toast.error('Enter a valid amount')
      return
    }
    setActionLoading(true)
    const { error } = await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action: 'adjust_balance',
      details: {
        user_id: modal.user.id,
        username: modal.user.username,
        amount,
        note: balanceNote.trim(),
        previous_balance: modal.user.balance
      }
    })
    if (!error) {
      toast.success(`Balance adjustment logged for ${modal.user.username}`)
      setModal(null)
    } else {
      toast.error('Failed to log adjustment')
    }
    setActionLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
      </form>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p style={{ marginTop: 12 }}>No users found</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movies</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Earnings</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username || 'No username'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={u.account_status || 'active'} /></td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14 }}>{u.movieCount}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(u.totalEarnings)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14 }}>{formatCurrency(u.balance)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{timeAgo(u.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a href={`/profile/${u.username}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" title="View Profile">
                        <Eye size={14} />
                      </a>
                      <button
                        className="btn btn-sm"
                        style={{ background: u.account_status === 'suspended' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: u.account_status === 'suspended' ? '#22c55e' : '#ef4444' }}
                        onClick={() => toggleSuspend(u)}
                        disabled={actionLoading}
                        title={u.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      >
                        {u.account_status === 'suspended' ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openBalanceModal(u)} title="Adjust Balance">
                        <DollarSign size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'balance' && (
        <Modal onClose={() => setModal(null)} title={`Adjust Balance - ${modal.user.username || modal.user.email}`}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Balance</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(modal.user.balance)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Adjustment Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder="Use negative to deduct"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Note / Reason</label>
            <input
              className="form-input"
              value={balanceNote}
              onChange={(e) => setBalanceNote(e.target.value)}
              placeholder="Reason for adjustment..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={adjustBalance} disabled={actionLoading}>
              {actionLoading ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Log Adjustment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminReferrals() {
  const { user } = useAuth()
  const toast = useToast()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchReferrals() }, [statusFilter])

  async function fetchReferrals() {
    setLoading(true)
    let query = supabase
      .from('referrals')
      .select('*, movie:movies(title, slug), referrer:referrer_id(username, email), referred:user_id(username, email)')
      .order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query.limit(100)
    setReferrals(data || [])
    setLoading(false)
  }

  async function logAudit(action, details) {
    await supabase.from('audit_logs').insert({ admin_id: user.id, action, details })
  }

  async function approveReferral(r) {
    setActionLoading(true)
    const { error } = await supabase.rpc('qualify_referral', { p_referral_id: r.id })
    if (!error) {
      await logAudit('approve_referral', { referral_id: r.id, movie_id: r.movie_id })
      toast.success('Referral approved')
      fetchReferrals()
    } else {
      toast.error('Failed to approve referral')
    }
    setActionLoading(false)
  }

  async function rejectReferral(r) {
    if (!confirm('Reject this referral?')) return
    setActionLoading(true)
    const { error } = await supabase.from('referrals').update({ status: 'rejected' }).eq('id', r.id)
    if (!error) {
      await logAudit('reject_referral', { referral_id: r.id, movie_id: r.movie_id })
      toast.success('Referral rejected')
      fetchReferrals()
    } else {
      toast.error('Failed to reject referral')
    }
    setActionLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['all', 'pending', 'qualified', 'rejected'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : referrals.length === 0 ? (
        <div className="empty-state">
          <Share2 size={48} />
          <p style={{ marginTop: 12 }}>No referrals found</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movie</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Referrer</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Referred User</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fraud Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{r.movie?.title || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.referrer?.username || r.referrer?.email || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.referred?.username || r.referred?.email || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13 }}>{r.fraud_score ?? 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(r.reward_amount)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{timeAgo(r.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {r.status === 'pending' && (
                        <>
                          <button className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} onClick={() => approveReferral(r)} disabled={actionLoading} title="Approve">
                            <Check size={14} />
                          </button>
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => rejectReferral(r)} disabled={actionLoading} title="Reject">
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminWithdrawals() {
  const { user } = useAuth()
  const toast = useToast()
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchWithdrawals() }, [statusFilter])

  async function fetchWithdrawals() {
    setLoading(true)
    let query = supabase
      .from('withdrawals')
      .select('*, profiles:user_id(username, email)')
      .order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query.limit(100)
    setWithdrawals(data || [])
    setLoading(false)
  }

  async function logAudit(action, details) {
    await supabase.from('audit_logs').insert({ admin_id: user.id, action, details })
  }

  async function approveWithdrawal(w) {
    setActionLoading(true)
    const { error } = await supabase.from('withdrawals').update({
      status: 'paid',
      processed_by: user.id,
      processed_at: new Date().toISOString()
    }).eq('id', w.id)
    if (!error) {
      await logAudit('approve_withdrawal', { withdrawal_id: w.id, user_id: w.user_id, amount: w.amount })
      toast.success(`Withdrawal of ${formatCurrency(w.amount)} approved`)
      fetchWithdrawals()
    } else {
      toast.error('Failed to approve withdrawal')
    }
    setActionLoading(false)
  }

  function openReject(w) {
    setModal({ type: 'reject', withdrawal: w })
    setRejectReason('')
  }

  async function confirmRejectWithdrawal() {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setActionLoading(true)
    const { error } = await supabase.from('withdrawals').update({
      status: 'rejected',
      rejection_reason: rejectReason.trim()
    }).eq('id', modal.withdrawal.id)
    if (!error) {
      await logAudit('reject_withdrawal', { withdrawal_id: modal.withdrawal.id, user_id: modal.withdrawal.user_id, reason: rejectReason.trim() })
      toast.success('Withdrawal rejected')
      setModal(null)
      fetchWithdrawals()
    } else {
      toast.error('Failed to reject withdrawal')
    }
    setActionLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['all', 'pending', 'paid', 'rejected'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} />
          <p style={{ marginTop: 12 }}>No withdrawal requests</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Method</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{w.profiles?.username || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.payment_details}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(w.amount)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, textTransform: 'uppercase' }}>{w.payment_method}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{timeAgo(w.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {w.status === 'pending' && (
                        <>
                          <button className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }} onClick={() => approveWithdrawal(w)} disabled={actionLoading} title="Approve & Mark Paid">
                            <Check size={14} />
                          </button>
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => openReject(w)} disabled={actionLoading} title="Reject">
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'reject' && (
        <Modal onClose={() => setModal(null)} title="Reject Withdrawal">
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(modal.withdrawal.amount)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Rejection Reason *</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmRejectWithdrawal} disabled={actionLoading}>
              {actionLoading ? <><Loader2 size={16} className="spin" /> Processing...</> : 'Reject Withdrawal'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminSettings() {
  const { user } = useAuth()
  const toast = useToast()
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState({})

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*').order('category', { ascending: true })
    const all = data || []
    setSettings(all)
    const vals = {}
    all.forEach(s => { vals[s.key] = s.value || '' })
    setFormValues(vals)
    setLoading(false)
  }

  function updateValue(key, value) {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const updates = settings.map(s =>
        supabase.from('settings').update({ value: formValues[s.key] || '' }).eq('id', s.id)
      )
      await Promise.all(updates)
      await supabase.from('audit_logs').insert({
        admin_id: user.id,
        action: 'update_settings',
        details: { keys: Object.keys(formValues) }
      })
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  const categories = {}
  settings.forEach(s => {
    const cat = s.category || 'general'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(s)
  })

  const categoryLabels = {
    submission: 'Submission',
    duplicate_detection: 'Duplicate Detection',
    rewards: 'Rewards',
    referral: 'Referral',
    movies: 'Movies',
    website: 'Website',
    general: 'General'
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <div>
      {Object.entries(categories).map(([cat, items]) => (
        <div key={cat} className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} />
            {categoryLabels[cat] || cat}
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {items.map((s) => (
              <div key={s.id} className="form-group">
                <label className="form-label" style={{ textTransform: 'capitalize' }}>
                  {s.key.replace(/_/g, ' ')}
                </label>
                {s.value === 'true' || s.value === 'false' ? (
                  <select
                    className="form-input"
                    value={formValues[s.key] || s.value}
                    onChange={(e) => updateValue(s.key, e.target.value)}
                    style={{ width: 'auto', maxWidth: 200 }}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input
                    className="form-input"
                    value={formValues[s.key] || ''}
                    onChange={(e) => updateValue(s.key, e.target.value)}
                    style={{ maxWidth: 400 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary btn-lg" onClick={saveSettings} disabled={saving}>
          {saving ? <><Loader2 size={18} className="spin" /> Saving...</> : <><Save size={18} /> Save All Settings</>}
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { user, profile, loading: authLoading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (!authLoading && (!user || !profile?.is_admin)) {
      toast.error('Access denied. Admin only.')
      navigate('/')
    }
  }, [user, profile, authLoading])

  if (authLoading) {
    return (
      <div className="page">
        <Helmet><title>Admin - ShareFlix</title></Helmet>
        <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) return null

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />
      case 'movies': return <AdminMovies />
      case 'users': return <AdminUsers />
      case 'referrals': return <AdminReferrals />
      case 'withdrawals': return <AdminWithdrawals />
      case 'settings': return <AdminSettings />
      default: return <AdminDashboard />
    }
  }

  return (
    <div className="page">
      <Helmet>
        <title>Admin Dashboard - ShareFlix</title>
      </Helmet>
      <div className="container" style={{ padding: '32px 16px' }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Sidebar */}
          <aside className="admin-sidebar" style={{
            width: 220, flexShrink: 0,
            position: 'sticky', top: 80, alignSelf: 'flex-start'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={22} /> Admin
            </h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`admin-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                      background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                      color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s', textAlign: 'left', width: '100%'
                    }}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="admin-content" style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
              {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h1>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
