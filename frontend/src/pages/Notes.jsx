import React, { useState, useEffect } from 'react'
import { Nav } from '../components/Nav.jsx'
import { useAuth } from '../hooks/useAuth.js'

const PLACEHOLDER_NOTES = [
  {
    title: 'Lecture — March 18',
    date: 'Mar 18, 2026',
    excerpt: '## Neural Networks\n- Activation functions determine non-linearity\n- Backpropagation adjusts weights via gradient descent\n- Overfitting can be mitigated with dropout layers...',
  },
  {
    title: 'Lecture — March 14',
    date: 'Mar 14, 2026',
    excerpt: '## Operating Systems\n- Process scheduling: FIFO, Round Robin, Priority\n- Virtual memory maps logical to physical addresses\n- Page faults trigger OS to load data from disk...',
  },
  {
    title: 'Lecture — March 11',
    date: 'Mar 11, 2026',
    excerpt: '## Data Structures\n- Hash tables provide O(1) average lookup\n- Collision resolution: chaining vs open addressing\n- Load factor impacts performance; rehash when > 0.75...',
  },
  {
    title: 'Lecture — March 7',
    date: 'Mar 7, 2026',
    excerpt: '## Algorithms\n- Divide and conquer reduces complexity recursively\n- Merge sort guarantees O(n log n) worst case\n- Dynamic programming memoizes overlapping subproblems...',
  },
  {
    title: 'Lecture — March 4',
    date: 'Mar 4, 2026',
    excerpt: '## Computer Networks\n- TCP ensures reliable ordered delivery via handshake\n- UDP trades reliability for speed — used in video/gaming\n- DNS resolves human-readable names to IP addresses...',
  },
  {
    title: 'Lecture — Feb 28',
    date: 'Feb 28, 2026',
    excerpt: '## Linear Algebra\n- Matrix multiplication: rows × columns, not commutative\n- Eigenvectors remain directionally unchanged under transformation\n- PCA uses eigenvectors to reduce dimensionality...',
  },
]

function NoteCard({ note, i, visible }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background:   'var(--bg-card)',
        border:       `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding:      '20px',
        display:      'flex',
        flexDirection: 'column',
        gap:          '10px',
        opacity:      visible ? 1 : 0,
        transform:    visible ? (hovered ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(10px)',
        transition:   `opacity 0.4s ease ${0.05 + i * 0.06}s, transform 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease`,
        boxShadow:    hovered ? '0 4px 20px rgba(110,193,255,0.08)' : 'none',
        cursor:       'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            {note.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{note.date}</div>
        </div>
      </div>

      <div style={{
        fontSize:     '12px',
        color:        'var(--text-muted)',
        lineHeight:   1.65,
        fontFamily:   'var(--font-mono)',
        background:   'var(--bg-elevated)',
        border:       '1px solid var(--border)',
        borderRadius: '8px',
        padding:      '10px 12px',
        whiteSpace:   'pre-line',
        overflow:     'hidden',
        display:      '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        textOverflow: 'ellipsis',
      }}>
        {note.excerpt}
      </div>

      <button
        style={{
          alignSelf:    'flex-start',
          padding:      '7px 16px',
          borderRadius: 'var(--radius)',
          background:   'var(--accent)',
          color:        '#fff',
          fontSize:     '13px',
          fontWeight:   500,
          border:       'none',
          cursor:       'pointer',
          marginTop:    4,
          transition:   'background 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
      >
        Open
      </button>
    </div>
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

export default function Notes() {
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
        maxWidth:   900,
        margin:     '0 auto',
        padding:    'calc(var(--nav-h) + 48px) 24px 80px',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <h1 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '28px',
          fontWeight:    300,
          color:         'var(--text)',
          marginBottom:  '6px',
          letterSpacing: '-0.01em',
        }}>
          Your Notes
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 36, fontWeight: 300 }}>
          All your past sessions in one place.
        </p>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 '16px',
          marginBottom:        40,
        }}>
          {PLACEHOLDER_NOTES.map((note, i) => (
            <NoteCard key={i} note={note} i={i} visible={visible} />
          ))}
        </div>

        <div style={{
          padding:      '16px 20px',
          borderRadius: 'var(--radius)',
          background:   'var(--bg-card)',
          border:       '1px solid var(--border)',
          fontSize:     '13px',
          color:        'var(--text-muted)',
          lineHeight:   1.6,
          textAlign:    'center',
        }}>
          Past sessions will sync automatically once your account is connected to the cloud. Coming soon.
        </div>
      </main>
    </div>
  )
}
