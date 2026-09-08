import { Link } from 'react-router-dom'
import { Home, Film, Upload, DollarSign, Wallet, User, LogOut, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          Share<span style={{ color: 'var(--accent)' }}>Flix</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link">
            <Home size={18} /> Home
          </Link>
          <Link to="/movies" className="nav-link">
            <Film size={18} /> Movies
          </Link>
          <Link to="/submit" className="nav-link">
            <Upload size={18} /> Submit
          </Link>
          <Link to="/dashboard" className="nav-link">
            <DollarSign size={18} /> Earn
          </Link>
          <Link to="/wallet" className="nav-link">
            <Wallet size={18} /> Wallet
          </Link>
          <Link to="/profile" className="nav-link">
            <User size={18} /> Profile
          </Link>
        </nav>

        <div className="header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <span className="nav-link" style={{ cursor: 'default' }}>
                <User size={16} /> {profile?.username || user.email}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={signOut}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
