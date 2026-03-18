import React, { useEffect, useState } from 'react'

const LogoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="22" height="22" rx="6" fill="#D97757"/>
    <path d="M6 7h10M6 11h10M6 15h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

export default function Login() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--bg)',
      padding:        '20px',
    }}>
      {/* Ambient glow */}
      <div style={{
        position:    'fixed',
        top:         '30%',
        left:        '50%',
        transform:   'translateX(-50%)',
        width:       '60vw',
        height:      '40vh',
        background:  'radial-gradient(ellipse, rgba(217,119,87,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width:      '100%',
        maxWidth:   400,
        background: 'var(--bg-card)',
        border:     '1px solid var(--border)',
        borderRadius: '16px',
        padding:    '40px',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        position:   'relative',
        zIndex:     1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <LogoIcon />
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   400,
            fontSize:     '24px',
            marginTop:    '14px',
            marginBottom: '6px',
            color:        'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            QuickNotes
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Sign in to your account
          </p>
        </div>

        {/* Google OAuth button */}
        <a
          href="/auth/google"
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '10px',
            width:          '100%',
            padding:        '13px 20px',
            borderRadius:   'var(--radius)',
            background:     'var(--bg-elevated)',
            border:         '1px solid var(--border)',
            color:          'var(--text)',
            fontSize:       '14px',
            fontWeight:     500,
            textDecoration: 'none',
            transition:     'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = '#363330' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
        >
          <GoogleColorIcon />
          Continue with Google
        </a>

        <p style={{
          marginTop:  '24px',
          textAlign:  'center',
          fontSize:   '12px',
          color:      'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          By continuing, you agree to QuickNotes' terms of service.
          <br />No credit card required.
        </p>
      </div>
    </div>
  )
}

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
