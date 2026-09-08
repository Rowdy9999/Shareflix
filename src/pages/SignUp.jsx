import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function SignUp() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { signUp } = useAuth()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, username)
      setSubmitted(true)
      toast.success('Check your email for confirmation')
    } catch (err) {
      toast.error(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="page">
        <Helmet>
          <title>Sign Up - ShareFlix</title>
        </Helmet>
        <div className="container">
          <div className="card">
            <h2>Check Your Email</h2>
            <p>We've sent a confirmation link to <strong>{email}</strong>. Please verify your account.</p>
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
        <title>Sign Up - ShareFlix</title>
      </Helmet>
      <div className="container">
        <div className="card">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choose a username"
              />
            </div>
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
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
