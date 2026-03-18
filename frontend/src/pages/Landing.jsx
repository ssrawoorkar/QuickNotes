import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="22" height="22" rx="6" fill="#D97757"/>
    <path d="M6 7h10M6 11h10M6 15h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const steps = [
  {
    num: '01',
    title: 'Record',
    desc: 'Hit start and speak. QuickNotes captures your microphone in real time with intelligent silence detection — no babysitting required.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="8" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M3.5 11.5A7.5 7.5 0 0011 19m0 0a7.5 7.5 0 007.5-7.5M11 19v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Transcribe',
    desc: 'Every spoken word is transcribed with timestamps using Whisper — accurately, even with technical jargon and fast speakers.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 5h16M3 9h12M3 13h14M3 17h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Study Notes',
    desc: 'AI distills the transcript into structured study notes — definitions, key ideas, and examples — formatted with headings and bullets.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M9 3H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M9 3v6h6M7 13h8M7 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function Landing() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

      {/* Grain texture overlay */}
      <div style={{
        position:   'fixed',
        inset:      0,
        pointerEvents: 'none',
        zIndex:     1,
        opacity:    0.028,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '180px',
      }} />

      {/* Ambient glow */}
      <div style={{
        position:   'fixed',
        top:        '-20%',
        left:       '50%',
        transform:  'translateX(-50%)',
        width:      '80vw',
        height:     '60vh',
        background: 'radial-gradient(ellipse at center, rgba(217,119,87,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex:     0,
      }} />

      {/* Nav */}
      <nav style={{
        position:       'relative',
        zIndex:         10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '20px 40px',
        borderBottom:   '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoIcon />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', letterSpacing: '-0.01em' }}>
            QuickNotes
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href="/auth/google"
            style={{
              padding:      '9px 20px',
              borderRadius: 'var(--radius)',
              fontSize:     '14px',
              fontWeight:   500,
              color:        'var(--text-mid)',
              border:       '1px solid var(--border)',
              background:   'transparent',
              cursor:       'pointer',
              transition:   'all 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-mid)' }}
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position:    'relative',
        zIndex:      2,
        maxWidth:    760,
        margin:      '0 auto',
        padding:     '100px 40px 80px',
        textAlign:   'center',
        opacity:     visible ? 1 : 0,
        transform:   visible ? 'translateY(0)' : 'translateY(20px)',
        transition:  'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <div style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '7px',
          padding:        '5px 13px',
          borderRadius:   '20px',
          border:         '1px solid rgba(217,119,87,0.3)',
          background:     'var(--accent-dim)',
          color:          'var(--accent)',
          fontSize:       '12px',
          fontWeight:     500,
          marginBottom:   '28px',
          letterSpacing:  '0.02em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          AI-Powered Lecture Notes
        </div>

        <h1 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(44px, 7vw, 72px)',
          fontWeight:   300,
          lineHeight:   1.08,
          letterSpacing: '-0.02em',
          color:        'var(--text)',
          marginBottom: '24px',
        }}>
          Never miss
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>a word.</em>
        </h1>

        <p style={{
          fontSize:    '18px',
          lineHeight:  1.65,
          color:       'var(--text-mid)',
          maxWidth:    520,
          margin:      '0 auto 40px',
          fontWeight:  300,
        }}>
          QuickNotes records your lectures, transcribes every word in real time, and generates structured study notes automatically — so you can stay present and focused.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/auth/google"
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '14px 28px',
              borderRadius: 'var(--radius)',
              background:   'var(--accent)',
              color:        '#fff',
              fontSize:     '15px',
              fontWeight:   500,
              textDecoration: 'none',
              transition:   'all 0.15s ease',
              boxShadow:    '0 4px 20px rgba(217,119,87,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,119,87,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,119,87,0.3)' }}
          >
            <GoogleIcon />
            Get Started Free
          </a>
          <a
            href="/auth/google"
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              padding:      '14px 28px',
              borderRadius: 'var(--radius)',
              background:   'var(--bg-elevated)',
              border:       '1px solid var(--border)',
              color:        'var(--text-mid)',
              fontSize:     '15px',
              fontWeight:   500,
              textDecoration: 'none',
              transition:   'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-mid)' }}
          >
            Sign In
          </a>
        </div>
      </section>

      {/* Steps */}
      <section style={{
        position:  'relative',
        zIndex:    2,
        maxWidth:  1000,
        margin:    '0 auto',
        padding:   '40px 40px 100px',
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
      }}>
        <div style={{
          display:    'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap:        '16px',
        }}>
          {steps.map((step, i) => (
            <div
              key={step.num}
              style={{
                background:   'var(--bg-card)',
                border:       '1px solid var(--border)',
                borderRadius: '14px',
                padding:      '28px',
                opacity:      visible ? 1 : 0,
                transform:    visible ? 'translateY(0)' : 'translateY(16px)',
                transition:   `opacity 0.5s ease ${0.3 + i * 0.1}s, transform 0.5s ease ${0.3 + i * 0.1}s`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '10px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(217,119,87,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)',
                }}>
                  {step.icon}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {step.num}
                </span>
              </div>
              <h3 style={{
                fontFamily:   'var(--font-display)',
                fontSize:     '20px',
                fontWeight:   400,
                marginBottom: 8,
                color:        'var(--text)',
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--text-muted)', fontWeight: 300 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position:      'relative',
        zIndex:        2,
        textAlign:     'center',
        padding:       '24px 40px',
        borderTop:     '1px solid var(--border)',
        color:         'var(--text-muted)',
        fontSize:      '13px',
      }}>
        QuickNotes — built for students who want to be present
      </footer>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="rgba(255,255,255,0.9)"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="rgba(255,255,255,0.8)"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="rgba(255,255,255,0.7)"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="rgba(255,255,255,0.9)"/>
    </svg>
  )
}
