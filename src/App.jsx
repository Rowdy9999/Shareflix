import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Movies from './pages/Movies'
import MoviePage from './pages/MoviePage'
import SubmitMovie from './pages/SubmitMovie'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Admin from './pages/Admin'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><div className="skeleton" style={{width:200,height:20}}/></div>
  if (!user) return <Navigate to="/login" />
  return children
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAdmin()) return <Navigate to="/" />
  return children
}

export default function App() {
  const { loading } = useAuth()

  return (
    <ToastProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movie/:slug" element={<MoviePage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitMovie /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
      <BottomNav />
    </ToastProvider>
  )
}
