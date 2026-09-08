import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Upload, Wallet, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/movies', icon: Film, label: 'Movies' },
  { to: '/submit', icon: Upload, label: 'Submit' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={user ? to : '/login'}
          className={`bottom-nav-item${pathname === to ? ' active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
