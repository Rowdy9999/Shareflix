import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { User, Mail, Link as LinkIcon, Copy, Check, Shield, Calendar, Camera, Loader2, Save } from 'lucide-react'
import { supabase, SITE_URL } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const newUrl = urlData.publicUrl
      setAvatarUrl(newUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      refreshProfile()
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar')
    }
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Username is required')
      return
    }
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') {
          toast.error('Username already taken')
        } else {
          throw error
        }
      } else {
        refreshProfile()
        toast.success('Profile updated successfully!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    }
    setLoading(false)
  }

  async function copyReferralLink() {
    const link = `${SITE_URL}/signup?ref=${profile?.referral_id || ''}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function getInitials() {
    const name = profile?.username || profile?.email || 'U'
    return name.substring(0, 2).toUpperCase()
  }

  const referralLink = `${SITE_URL}/signup?ref=${profile?.referral_id || ''}`

  return (
    <div className="page">
      <Helmet>
        <title>Profile - ShareFlix</title>
      </Helmet>
      <div className="container" style={{ maxWidth: 700, padding: '32px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Profile</h1>

        {/* Avatar & Basic Info */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
                />
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#fff',
                  border: '3px solid var(--border)'
                }}>
                  {getInitials()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '2px solid var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                {uploading ? <Loader2 size={12} className="spin" /> : <Camera size={12} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile?.username || 'User'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Shield size={14} />
                <span style={{ textTransform: 'capitalize' }}>{profile?.account_status || 'active'}</span>
                <span>•</span>
                <Calendar size={14} />
                <span>Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={20} /> Edit Profile
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                minLength={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, flex: 1 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Cannot change</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">User ID</label>
              <input
                className="form-input"
                value={user?.id || ''}
                disabled
                style={{ opacity: 0.7, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (
                <><Loader2 size={16} className="spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </form>
        </div>

        {/* Referral Link */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon size={20} /> Referral Link
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            Share this link with friends. You'll earn rewards when they sign up and contribute to the platform.
          </p>

          <div className="form-group">
            <label className="form-label">Your Referral Link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={referralLink}
                readOnly
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
              />
              <button className="btn btn-primary" onClick={copyReferralLink} type="button">
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Referral ID: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{profile?.referral_id || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Referrals: </span>
                <span style={{ fontWeight: 600 }}>{profile?.referral_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Account Details</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} /> Email
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} /> Username
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{profile?.username || 'Not set'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} /> Account Status
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 20,
                background: profile?.account_status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: profile?.account_status === 'active' ? '#22c55e' : '#ef4444',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {profile?.account_status || 'active'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} /> Member Since
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
