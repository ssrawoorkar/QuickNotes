import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav.jsx'
import { useAuth } from '../hooks/useAuth.js'

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function About() {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 60)
      return () => clearTimeout(t)
    }
  }, [loading])

  if (loading) return <LoadingScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav user={user} />

      <main style={{
        maxWidth:   600,
        margin:     '0 auto',
        padding:    'calc(var(--nav-h) + 64px) 24px 80px',
        textAlign:  'center',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {/* Avatar */}
        <div style={{
          width:        80,
          height:       80,
          borderRadius: '50%',
          background:   'var(--accent-dim)',
          border:       '2px solid var(--accent)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '36px',
          margin:       '0 auto 28px',
        }}>
          🧑‍💻
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(28px, 5vw, 40px)',
          fontWeight:    300,
          color:         'var(--text)',
          marginBottom:  12,
          letterSpacing: '-0.02em',
          lineHeight:    1.15,
        }}>
          Meet the Creator
        </h1>

        <p style={{
          fontSize:     '15px',
          fontWeight:   500,
          color:        'var(--accent)',
          marginBottom: 32,
          letterSpacing: '0.01em',
        }}>
          Built by a student, for students.
        </p>

        {/* Bio paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.75, fontWeight: 300 }}>
            QuickNotes was born out of frustration — the kind every student knows: scrambling to write down everything
            a professor says while simultaneously trying to actually understand it. The two tasks fight each other.
            This app is the answer to that problem.
          </p>

          <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.75, fontWeight: 300 }}>
            The vision is simple: let the AI handle the transcription and note-taking so you can be fully present
            in the lecture. No more choosing between listening and writing. No more missed definitions or skipped examples.
            Just real-time, structured notes generated automatically as you learn.
          </p>

          <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.75, fontWeight: 300 }}>
            This is an early build — more features are on the way, including quiz generation from your notes,
            lecture topic segmentation, and a full notes library. The goal is a tool that genuinely improves
            how students absorb and retain information, one lecture at a time.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '40px 0' }} />

        {/* Back link */}
        <Link
          to="/home"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            fontSize:       '14px',
            color:          'var(--text-muted)',
            textDecoration: 'none',
            transition:     'color 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ← Back to Home
        </Link>
      </main>
    </div>
  )
}
