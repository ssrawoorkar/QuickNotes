import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 11.5C2 9.567 4.239 8 7 8s5 1.567 5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.636 2.636l1.06 1.06M10.304 10.304l1.06 1.06M2.636 11.364l1.06-1.06M10.304 3.696l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const SignOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9.5 10l2.5-3-2.5-3M11.5 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/**
 * Profile dropdown component.
 * Shows avatar + name + chevron, opens a menu on click.
 */
export function ProfileDropdown({ user }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayName = user?.name || 'Account'
  const picture     = user?.picture || null

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          background:     'transparent',
          border:         '1px solid var(--border)',
          borderRadius:   '40px',
          padding:        '6px 12px 6px 6px',
          cursor:         'pointer',
          color:          'var(--text)',
          transition:     'border-color 0.15s, background 0.15s',
          ...(open ? { borderColor: 'var(--border-strong)', background: 'var(--bg-elevated)' } : {}),
        }}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {picture ? (
          <img
            src={picture}
            alt={displayName}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: '12px', fontWeight: 600,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: '13px', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <span style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 8px)',
          right:        0,
          minWidth:     200,
          background:   'var(--bg-elevated)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
          zIndex:       100,
          overflow:     'hidden',
          animation:    'dropdownIn 0.12s ease',
        }}>
          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* User info header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
            {user?.email && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
            )}
          </div>

          {/* Menu items */}
          <div style={{ padding: '4px 0' }}>
            <MenuLink to="/profile" icon={<UserIcon />} label="Your Profile" onClick={() => setOpen(false)} />
            <MenuLink to="/settings" icon={<SettingsIcon />} label="Settings" onClick={() => setOpen(false)} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
            <a
              href="/auth/logout"
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '10px',
                padding:     '9px 14px',
                fontSize:    '13px',
                color:       'var(--red)',
                transition:  'background 0.1s',
                cursor:      'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <SignOutIcon />
              Sign Out
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        padding:     '9px 14px',
        fontSize:    '13px',
        color:       'var(--text-mid)',
        transition:  'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-mid)' }}
    >
      {icon}
      {label}
    </Link>
  )
}
