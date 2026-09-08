import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { resetPassword } = useAuth()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSubmitted(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="page">
        <Helmet>
          <title>Forgot Password - ShareFlix</title>
        </Helmet>
        <div className="container">
          <div className="card">
            <h2>Email Sent</h2>
            <p>We've sent a password reset link to <strong>{email}</strong>.</p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Helmet>
        <title>Forgot Password - ShareFlix</title>
      </Helmet>
      <div className="container">
        <div className="card">
          <h2>Forgot Password</h2>
          <p>Enter your email and we'll send you a reset link.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            Remember your password? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
