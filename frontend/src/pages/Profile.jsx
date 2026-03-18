import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav.jsx'
import { useAuth } from '../hooks/useAuth.js'

const DISPLAY_NAME_KEY = 'qn_display_name'

export default function Profile() {
  const { user, loading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [saved, setSaved] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      const stored = localStorage.getItem(DISPLAY_NAME_KEY)
      setDisplayName(stored || user.name || '')
      const t = setTimeout(() => setVisible(true), 60)
      return () => clearTimeout(t)
    }
  }, [loading, user])

  const handleSave = () => {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <LoadingScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav user={user} />

      <main style={{
        maxWidth:    520,
        margin:      '0 auto',
        padding:     'calc(var(--nav-h) + 48px) 24px 80px',
        opacity:     visible ? 1 : 0,
        transform:   visible ? 'translateY(0)' : 'translateY(14px)',
        transition:  'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {/* Back link */}
        <Link
          to="/home"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '6px',
            fontSize:       '13px',
            color:          'var(--text-muted)',
            textDecoration: 'none',
            marginBottom:   32,
            transition:     'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-mid)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <BackArrow />
          Back to Home
        </Link>

        <h1 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     '28px',
          fontWeight:   300,
          color:        'var(--text)',
          marginBottom: '6px',
          letterSpacing: '-0.01em',
        }}>
          Your Profile
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 36, fontWeight: 300 }}>
          Manage your account and display preferences.
        </p>

        {/* Avatar + info card */}
        <div style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border)',
          borderRadius: '14px',
          padding:      '28px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{
                width:          64,
                height:         64,
                borderRadius:   '50%',
                background:     'var(--accent-dim)',
                border:         '2px solid rgba(217,119,87,0.3)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '24px',
                fontFamily:     'var(--font-display)',
                color:          'var(--accent)',
                fontWeight:     400,
              }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                {user?.name || 'Anonymous'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>

          {/* Edit display name */}
          <div>
            <label style={{
              display:      'block',
              fontSize:     '12px',
              fontWeight:   600,
              color:        'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Display Name
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Your display name"
                style={{
                  flex:         1,
                  padding:      '10px 14px',
                  borderRadius: 'var(--radius)',
                  background:   'var(--bg-elevated)',
                  border:       '1px solid var(--border)',
                  color:        'var(--text)',
                  fontSize:     '14px',
                  outline:      'none',
                  transition:   'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleSave}
                style={{
                  padding:      '10px 18px',
                  borderRadius: 'var(--radius)',
                  background:   saved ? 'rgba(76,175,125,0.15)' : 'var(--accent)',
                  border:       saved ? '1px solid rgba(76,175,125,0.3)' : 'none',
                  color:        saved ? 'var(--green)' : '#fff',
                  fontSize:     '13px',
                  fontWeight:   500,
                  cursor:       'pointer',
                  transition:   'all 0.15s',
                  minWidth:     80,
                  whiteSpace:   'nowrap',
                }}
                onMouseEnter={e => { if (!saved) e.currentTarget.style.background = 'var(--accent-hover)' }}
                onMouseLeave={e => { if (!saved) e.currentTarget.style.background = 'var(--accent)' }}
              >
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 7 }}>
              Display name is saved locally in your browser.
            </p>
          </div>
        </div>

        {/* Account info card */}
        <div style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border)',
          borderRadius: '14px',
          overflow:     'hidden',
        }}>
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Auth Provider" value="Google" last />
        </div>

        <div style={{ marginTop: 24 }}>
          <a
            href="/auth/logout"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '8px',
              padding:        '10px 18px',
              borderRadius:   'var(--radius)',
              background:     'var(--red-dim)',
              color:          'var(--red)',
              border:         '1px solid rgba(224,92,92,0.2)',
              fontSize:       '13px',
              fontWeight:     500,
              textDecoration: 'none',
              transition:     'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
          >
            Sign Out
          </a>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '14px 20px',
      borderBottom:   last ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-mid)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
