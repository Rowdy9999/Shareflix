import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { DollarSign, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, X, Loader2 } from 'lucide-react'
import { supabase, formatCurrency, timeAgo } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Wallet() {
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState({
    available: 0,
    pending: 0,
    total_earned: 0,
    total_withdrawn: 0
  })
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [minWithdrawal, setMinWithdrawal] = useState(100)

  useEffect(() => {
    if (user) {
      fetchData()
      fetchSettings()
    }
  }, [user])

  async function fetchSettings() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'minimum_withdrawal')
      .maybeSingle()
    if (data?.value) setMinWithdrawal(parseFloat(data.value) || 100)
  }

  async function fetchData() {
    setLoading(true)

    const { data: movies } = await supabase
      .from('movies')
      .select('available_earnings, pending_earnings, total_earnings')
      .eq('owner_id', user.id)

    const allMovies = movies || []

    const available = allMovies.reduce((sum, m) => sum + (m.available_earnings || 0), 0)
    const pending = allMovies.reduce((sum, m) => sum + (m.pending_earnings || 0), 0)
    const totalEarned = allMovies.reduce((sum, m) => sum + (m.total_earnings || 0), 0)

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const totalWithdrawn = (withdrawals || [])
      .filter(w => w.status === 'completed' || w.status === 'approved')
      .reduce((sum, w) => sum + (w.amount || 0), 0)

    setBalance({
      available,
      pending,
      total_earned: totalEarned,
      total_withdrawn: totalWithdrawn
    })

    setTransactions(withdrawals || [])
    setLoading(false)
  }

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (amount < minWithdrawal) {
      toast.error(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}`)
      return
    }
    if (amount > balance.available) {
      toast.error('Insufficient balance')
      return
    }
    if (!paymentDetails.trim()) {
      toast.error('Please enter payment details')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Withdrawal request submitted successfully!')
      setShowModal(false)
      setWithdrawAmount('')
      setPaymentDetails('')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to submit withdrawal request')
    }
    setSubmitting(false)
  }

  function getTransactionIcon(type) {
    if (type === 'earning') return <ArrowDownRight size={16} color="#22c55e" />
    return <ArrowUpRight size={16} color="#ef4444" />
  }

  function getStatusStyle(status) {
    const map = {
      completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
      approved: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
      pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
      rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    }
    return map[status] || map.pending
  }

  if (loading) {
    return (
      <div className="page">
        <Helmet>
          <title>Wallet - ShareFlix</title>
        </Helmet>
        <div className="container" style={{ padding: '32px 16px' }}>
          <div className="skeleton" style={{ width: 180, height: 32, marginBottom: 32 }} />
          <div className="grid-4" style={{ gap: 16, marginBottom: 32 }}>
            {[1, 2, 3, 4].map(i => (
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
        <title>Wallet - ShareFlix</title>
      </Helmet>
      <div className="container" style={{ padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <WalletIcon size={28} /> Wallet
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your earnings and withdrawals</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <DollarSign size={16} /> Request Withdrawal
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid-4" style={{ gap: 16, marginBottom: 32 }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
            <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={22} />
              {formatCurrency(balance.available)}
            </div>
            <div className="stat-label">Available Balance</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
            <div className="stat-value" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={22} />
              {formatCurrency(balance.pending)}
            </div>
            <div className="stat-label">Pending Balance</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--info)' }}>
            <div className="stat-value" style={{ color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={22} />
              {formatCurrency(balance.total_earned)}
            </div>
            <div className="stat-label">Total Earned</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--text-muted)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUpRight size={22} />
              {formatCurrency(balance.total_withdrawn)}
            </div>
            <div className="stat-label">Total Withdrawn</div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Transaction History</h2>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <DollarSign size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>No transactions yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Your earnings and withdrawals will appear here</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Method</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const statusStyle = getStatusStyle(tx.status)
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {timeAgo(tx.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getTransactionIcon('withdrawal')}
                            <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>Withdrawal</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                          -{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, textTransform: 'uppercase' }}>
                          {tx.payment_method}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '90%', padding: 24, borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Request Withdrawal</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Available Balance</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(balance.available)}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                min={minWithdrawal}
                max={balance.available}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Min: ${minWithdrawal}`}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Minimum withdrawal: {formatCurrency(minWithdrawal)}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="upi">UPI</option>
                <option value="paytm">Paytm</option>
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {paymentMethod === 'upi' ? 'UPI ID' :
                 paymentMethod === 'paytm' ? 'Paytm Number' :
                 paymentMethod === 'bank' ? 'Bank Account Details' :
                 'PayPal Email'}
              </label>
              <input
                className="form-input"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={
                  paymentMethod === 'upi' ? 'your@upi' :
                  paymentMethod === 'paytm' ? '+91XXXXXXXXXX' :
                  paymentMethod === 'bank' ? 'Account No, IFSC, Bank Name' :
                  'email@paypal.com'
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={submitting}>
                {submitting ? (
                  <><Loader2 size={16} className="spin" /> Processing...</>
                ) : (
                  <><DollarSign size={16} /> Withdraw</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
