import React from 'react'
import { Link } from 'react-router-dom'
import { ProfileDropdown } from './ProfileDropdown.jsx'

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="22" height="22" rx="6" fill="#D97757"/>
    <path d="M6 7h10M6 11h10M6 15h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

/**
 * Top navigation bar.
 * @param {object}      user        - Current user from useAuth
 * @param {ReactNode}   center      - Optional center slot content
 * @param {string}      homeLink    - Link for the logo (defaults to /home)
 */
export function Nav({ user, center, homeLink = '/home' }) {
  return (
    <nav style={{
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      height:         'var(--nav-h)',
      background:     'rgba(28, 25, 23, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:   '1px solid var(--border)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 20px',
      zIndex:         50,
    }}>
      {/* Left: Logo */}
      <Link
        to={homeLink}
        style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}
      >
        <LogoIcon />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize:   '17px',
          color:      'var(--text)',
          letterSpacing: '-0.01em',
        }}>
          QuickNotes
        </span>
      </Link>

      {/* Center slot */}
      {center && (
        <div style={{
          position:   'absolute',
          left:       '50%',
          transform:  'translateX(-50%)',
          display:    'flex',
          alignItems: 'center',
          gap:        '12px',
        }}>
          {center}
        </div>
      )}

      {/* Right: Profile dropdown */}
      {user && <ProfileDropdown user={user} />}
    </nav>
  )
}
