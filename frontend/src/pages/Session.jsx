import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav.jsx'
import { ProfileDropdown } from '../components/ProfileDropdown.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { useRecorder } from '../hooks/useRecorder.js'
import { renderMarkdown } from '../lib/markdown.js'
import { download } from '../lib/download.js'

// Status enum
const STATUS = {
  IDLE:        'idle',
  CONNECTING:  'connecting',
  RECORDING:   'recording',
  STOPPED:     'stopped',
}

export default function Session() {
  const { user, loading } = useAuth()
  const { connected, send, lastNotes } = useWebSocket()
  const [status, setStatus]       = useState(STATUS.IDLE)
  const [notes, setNotes]         = useState('')
  const [driveStatus, setDriveStatus] = useState('idle') // idle | saving | saved | creating | created | error
  const [docUrl, setDocUrl]       = useState(null)
  const transcriptEndRef          = useRef(null)

  // Update notes when WS sends them
  useEffect(() => {
    if (lastNotes) setNotes(lastNotes)
  }, [lastNotes])

  // Scroll transcript to bottom on new entries
  const scrollTranscript = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleTranscript = useCallback((entry) => {
    // entry is already added to transcript state in useRecorder
    setTimeout(scrollTranscript, 50)
  }, [scrollTranscript])

  const handleSend = useCallback((msg) => {
    send(msg)
  }, [send])

  const { isRecording, start, stop, transcript, clearTranscript } = useRecorder({
    onTranscript: handleTranscript,
    onSend:       handleSend,
  })

  const handleStart = async () => {
    if (!connected) {
      setStatus(STATUS.CONNECTING)
      // Wait briefly for WS to connect
      await new Promise(r => setTimeout(r, 800))
    }
    try {
      setStatus(STATUS.RECORDING)
      send({ action: 'start' })
      await start()
    } catch (err) {
      console.error('Failed to start recording:', err)
      setStatus(STATUS.IDLE)
    }
  }

  const handleStop = () => {
    stop()
    send({ action: 'stop' })
    setStatus(STATUS.STOPPED)
  }

  const handleNewNotes = () => {
    if (isRecording) handleStop()
    clearTranscript()
    setNotes('')
    setDriveStatus('idle')
    setDocUrl(null)
    send({ action: 'start' })
    send({ action: 'stop' })
    setStatus(STATUS.IDLE)
  }

  const handleDownloadNotes = () => {
    if (!notes) return
    download('lecture_notes.md', notes, 'text/markdown')
  }

  const handleDownloadTranscript = () => {
    if (!transcript.length) return
    const content = transcript.map(e => `[${e.timestamp}] ${e.text}`).join('\n')
    download('lecture_transcript.txt', content, 'text/plain')
  }

  const handleSaveToDrive = async () => {
    if (!notes) return
    setDriveStatus('saving')
    try {
      const res = await fetch('/drive/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: notes }),
        credentials: 'include',
      })
      if (res.status === 401) { window.location.href = '/auth/google'; return }
      if (!res.ok) throw new Error('Save failed')
      setDriveStatus('saved')
    } catch {
      setDriveStatus('error')
      setTimeout(() => setDriveStatus('idle'), 3000)
    }
  }

  const handleOpenInDocs = async () => {
    if (!notes) return
    setDriveStatus('creating')
    try {
      const res = await fetch('/drive/create-doc', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: notes }),
        credentials: 'include',
      })
      if (res.status === 401) { window.location.href = '/auth/google'; return }
      if (!res.ok) throw new Error('Create failed')
      const data = await res.json()
      setDocUrl(data.doc_url)
      setDriveStatus('created')
      window.open(data.doc_url, '_blank', 'noopener')
    } catch {
      setDriveStatus('error')
      setTimeout(() => setDriveStatus('idle'), 3000)
    }
  }

  if (loading) return <LoadingScreen />

  const centerSlot = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StatusDot status={status} />
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: 80 }}>
        {statusLabel(status)}
      </span>
      {(status === STATUS.IDLE || status === STATUS.STOPPED) && (
        <button
          onClick={handleStart}
          disabled={status === STATUS.CONNECTING}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '7px',
            padding:      '8px 16px',
            borderRadius: 'var(--radius)',
            background:   'var(--accent)',
            color:        '#fff',
            fontSize:     '13px',
            fontWeight:   500,
            border:       'none',
            cursor:       'pointer',
            transition:   'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <MicIcon size={13} />
          Start Recording
        </button>
      )}
      {status === STATUS.RECORDING && (
        <button
          onClick={handleStop}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '7px',
            padding:      '8px 16px',
            borderRadius: 'var(--radius)',
            background:   'var(--red-dim)',
            color:        'var(--red)',
            border:       '1px solid rgba(224,92,92,0.25)',
            fontSize:     '13px',
            fontWeight:   500,
            cursor:       'pointer',
            transition:   'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
        >
          <StopIcon />
          Stop
        </button>
      )}
    </div>
  )

  const rightSlot = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={handleNewNotes}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '7px',
          padding:      '8px 14px',
          borderRadius: 'var(--radius)',
          background:   'var(--accent-dim)',
          color:        'var(--accent)',
          border:       '1px solid rgba(110,193,255,0.25)',
          fontSize:     '13px',
          fontWeight:   500,
          cursor:       'pointer',
          transition:   'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)' }}
        title="Clear and start a new session"
      >
        <PlusIcon />
        New Notes
      </button>
      <ProfileDropdown user={user} />
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Custom nav for session — full right slot */}
      <nav style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        height:         'var(--nav-h)',
        background:     'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:   '1px solid var(--border)',
        display:        'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems:     'center',
        padding:        '0 20px',
        zIndex:         50,
        gap:            12,
      }}>
        {/* Left: Logo */}
        <Link
          to="/home"
          style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', justifySelf: 'start' }}
        >
          <LogoIcon />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            QuickNotes
          </span>
        </Link>

        {/* Center: status + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {centerSlot}
        </div>

        {/* Right: new notes + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: 'end' }}>
          {rightSlot}
        </div>
      </nav>

      {/* Two-panel layout */}
      <div style={{
        marginTop:    'var(--nav-h)',
        flex:         1,
        display:      'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:          0,
        overflow:     'hidden',
        height:       'calc(100vh - var(--nav-h))',
      }}>
        {/* Left: Live Transcript */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          borderRight:   '1px solid var(--border)',
          overflow:      'hidden',
        }}>
          <PanelHeader title="Live Transcript" count={transcript.length}>
            {transcript.length > 0 && (
              <IconButton onClick={handleDownloadTranscript} title="Download transcript (.txt)">
                <DownloadIcon />
              </IconButton>
            )}
          </PanelHeader>

          <div style={{
            flex:       1,
            overflowY:  'auto',
            padding:    '16px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize:   '13px',
            lineHeight: 1.7,
          }}>
            {transcript.length === 0 ? (
              <EmptyState
                icon={<MicIcon size={24} />}
                title="No transcript yet"
                body={status === STATUS.RECORDING ? 'Listening for speech…' : 'Start recording to capture audio'}
              />
            ) : (
              transcript.map((entry, i) => (
                <div key={i} style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{
                    color:      'var(--accent)',
                    fontSize:   '11px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontWeight: 500,
                    marginTop:  '0.15em',
                  }}>
                    {entry.timestamp}
                  </span>
                  <span style={{ color: 'var(--text-mid)' }}>{entry.text}</span>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Right: AI Generated Notes */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }}>
          <PanelHeader title="AI Generated Notes">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {notes && (
                <>
                  <IconButton onClick={handleDownloadNotes} title="Download notes (.md)">
                    <DownloadIcon />
                  </IconButton>
                  <DriveButton
                    driveStatus={driveStatus}
                    onSave={handleSaveToDrive}
                    onOpen={handleOpenInDocs}
                    docUrl={docUrl}
                  />
                </>
              )}
            </div>
          </PanelHeader>

          <div style={{
            flex:      1,
            overflowY: 'auto',
            padding:   '20px 24px',
          }}>
            {!notes ? (
              <EmptyState
                icon={<SparkleIcon />}
                title="Notes will appear here"
                body={status === STATUS.RECORDING
                  ? 'AI will generate notes as you speak…'
                  : 'Start recording to generate AI notes'
                }
              />
            ) : (
              <div
                className="notes-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }}
                style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-mid)' }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .notes-content h1 {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 400;
          color: var(--text);
          margin: 24px 0 10px;
          letter-spacing: -0.01em;
        }
        .notes-content h1:first-child { margin-top: 0; }
        .notes-content h2 {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 400;
          color: var(--text);
          margin: 20px 0 8px;
          letter-spacing: -0.005em;
        }
        .notes-content h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin: 16px 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 11px;
          color: var(--accent);
        }
        .notes-content p {
          margin: 6px 0;
          color: var(--text-mid);
        }
        .notes-content ul {
          margin: 8px 0 8px 0;
          padding-left: 20px;
        }
        .notes-content li {
          margin: 4px 0;
          color: var(--text-mid);
        }
        .notes-content li::marker {
          color: var(--accent);
        }
        .notes-content strong {
          color: var(--text);
          font-weight: 600;
        }
        .notes-content em {
          color: var(--text-mid);
          font-style: italic;
        }
        .notes-content code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: var(--bg-elevated);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent);
          border: 1px solid var(--border);
        }
        .notes-content hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 20px 0;
        }
        .notes-content br {
          display: block;
          margin: 4px 0;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

/* ─── Sub-components ─── */

function PanelHeader({ title, count, children }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '14px 20px',
      borderBottom:   '1px solid var(--border)',
      flexShrink:     0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{title}</span>
        {count > 0 && (
          <span style={{
            fontSize:     '11px',
            color:        'var(--text-muted)',
            background:   'var(--bg-elevated)',
            border:       '1px solid var(--border)',
            padding:      '1px 6px',
            borderRadius: '20px',
          }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{children}</div>
    </div>
  )
}

function EmptyState({ icon, title, body }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100%',
      minHeight:      240,
      gap:            12,
      color:          'var(--text-muted)',
      textAlign:      'center',
      padding:        '40px 20px',
    }}>
      <div style={{ opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-mid)' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: 220 }}>{body}</div>
    </div>
  )
}

function StatusDot({ status }) {
  const isRecording = status === STATUS.RECORDING

  const colors = {
    [STATUS.IDLE]:       'var(--text-muted)',
    [STATUS.CONNECTING]: 'var(--text-muted)',
    [STATUS.RECORDING]:  'var(--red)',
    [STATUS.STOPPED]:    'var(--text-muted)',
  }

  return (
    <span style={{
      display:      'inline-block',
      width:        8,
      height:       8,
      borderRadius: '50%',
      background:   colors[status] || 'var(--text-muted)',
      animation:    isRecording ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
    }} />
  )
}

function statusLabel(status) {
  switch (status) {
    case STATUS.IDLE:       return 'Idle'
    case STATUS.CONNECTING: return 'Connecting…'
    case STATUS.RECORDING:  return 'Recording…'
    case STATUS.STOPPED:    return 'Stopped'
    default: return ''
  }
}

function IconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          30,
        height:         30,
        borderRadius:   'var(--radius)',
        background:     'transparent',
        border:         '1px solid var(--border)',
        color:          'var(--text-muted)',
        cursor:         'pointer',
        transition:     'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {children}
    </button>
  )
}

function DriveButton({ driveStatus, onSave, onOpen, docUrl }) {
  const isBusy = driveStatus === 'saving' || driveStatus === 'creating'

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={onSave}
        disabled={isBusy || driveStatus === 'saved'}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '5px',
          padding:      '5px 10px',
          borderRadius: 'var(--radius)',
          background:   driveStatus === 'saved' ? 'rgba(76,175,125,0.12)' : 'var(--bg-elevated)',
          border:       `1px solid ${driveStatus === 'saved' ? 'rgba(76,175,125,0.3)' : 'var(--border)'}`,
          color:        driveStatus === 'saved' ? 'var(--green)' : 'var(--text-muted)',
          fontSize:     '12px',
          fontWeight:   500,
          cursor:       isBusy || driveStatus === 'saved' ? 'default' : 'pointer',
          transition:   'all 0.15s',
          opacity:      isBusy ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!isBusy && driveStatus !== 'saved') { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)' } }}
        onMouseLeave={e => { if (!isBusy && driveStatus !== 'saved') { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
      >
        <DriveIcon />
        {driveStatus === 'saving' ? 'Saving…' : driveStatus === 'saved' ? '✓ Saved' : 'Save to Drive'}
      </button>

      <button
        onClick={docUrl ? () => window.open(docUrl, '_blank', 'noopener') : onOpen}
        disabled={isBusy}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '5px',
          padding:      '5px 10px',
          borderRadius: 'var(--radius)',
          background:   driveStatus === 'created' ? 'rgba(76,175,125,0.12)' : 'var(--bg-elevated)',
          border:       `1px solid ${driveStatus === 'created' ? 'rgba(76,175,125,0.3)' : 'var(--border)'}`,
          color:        driveStatus === 'created' ? 'var(--green)' : 'var(--text-muted)',
          fontSize:     '12px',
          fontWeight:   500,
          cursor:       isBusy ? 'default' : 'pointer',
          transition:   'all 0.15s',
          opacity:      isBusy ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)' } }}
        onMouseLeave={e => { if (!isBusy) { e.currentTarget.style.color = driveStatus === 'created' ? 'var(--green)' : 'var(--text-muted)'; e.currentTarget.style.borderColor = driveStatus === 'created' ? 'rgba(76,175,125,0.3)' : 'var(--border)' } }}
      >
        <DocsIcon />
        {driveStatus === 'creating' ? 'Creating…' : driveStatus === 'created' ? '✓ Open Doc' : 'Open in Docs'}
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

/* ─── Icons ─── */

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="6" fill="#6EC1FF"/>
      <path d="M6 7h10M6 11h10M6 15h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function MicIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="8" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3.5 11.5A7.5 7.5 0 0011 19m0 0a7.5 7.5 0 007.5-7.5M11 19v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v7M4 6.5L7 10l3-3.5M2 11.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function DriveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 20H2l4-7L2 6h8l4 7-4 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 6l4 7h7l-4-7H9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M16.5 20H9.5l4-7h7l-4 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  )
}

function DocsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 3v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
