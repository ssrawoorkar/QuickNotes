import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav.jsx'
import { useAuth } from '../hooks/useAuth.js'

const tips = [
  { icon: '🎙', title: 'Start anywhere', body: 'Open a session and hit record. QuickNotes works in any browser that supports microphone access.' },
  { icon: '✦', title: 'Let AI summarize', body: 'Notes are generated automatically every minute. The longer you record, the richer the notes become.' },
  { icon: '⬇', title: 'Export anytime', body: 'Download your transcript as .txt or notes as .md. Save directly to Google Drive or open in Docs.' },
]

export default function Home() {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 60)
      return () => clearTimeout(t)
    }
  }, [loading])

  if (loading) return <LoadingScreen />

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav user={user} />

      <main style={{
        paddingTop:  'calc(var(--nav-h) + 60px)',
        paddingBottom: 80,
        maxWidth:    720,
        margin:      '0 auto',
        padding:     'calc(var(--nav-h) + 60px) 24px 80px',
        opacity:     visible ? 1 : 0,
        transform:   visible ? 'translateY(0)' : 'translateY(16px)',
        transition:  'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Greeting */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 6 }}>
            Welcome back
          </p>
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     'clamp(32px, 5vw, 48px)',
            fontWeight:   300,
            lineHeight:   1.1,
            color:        'var(--text)',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}>
            Hello, <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{firstName}.</em>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-mid)', lineHeight: 1.6, maxWidth: 480, fontWeight: 300 }}>
            Ready to capture something? Start a new session and let QuickNotes handle the notes while you focus on learning.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          to="/session"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '10px',
            padding:        '15px 30px',
            borderRadius:   'var(--radius)',
            background:     'var(--accent)',
            color:          '#fff',
            fontSize:       '15px',
            fontWeight:     500,
            textDecoration: 'none',
            transition:     'all 0.15s ease',
            boxShadow:      '0 4px 20px rgba(217,119,87,0.28)',
            marginBottom:   56,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,119,87,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,119,87,0.28)' }}
        >
          <MicIcon />
          Start New Session
        </Link>

        {/* Tips */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            How it works
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          '16px',
                  padding:      '18px 20px',
                  background:   'var(--bg-card)',
                  border:       '1px solid var(--border)',
                  borderRadius: '12px',
                  opacity:      visible ? 1 : 0,
                  transform:    visible ? 'translateY(0)' : 'translateY(10px)',
                  transition:   `opacity 0.4s ease ${0.1 + i * 0.08}s, transform 0.4s ease ${0.1 + i * 0.08}s`,
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1, marginTop: 1 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{tip.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
      <rect x="8" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3.5 11.5A7.5 7.5 0 0011 19m0 0a7.5 7.5 0 007.5-7.5M11 19v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--bg)',
    }}>
      <div style={{
        width:  24,
        height: 24,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius:   '50%',
        animation:      'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
