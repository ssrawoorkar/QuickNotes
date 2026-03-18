import React, { useState, useEffect } from 'react'
import { Nav } from '../components/Nav.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'

export default function Settings() {
  const { user, loading } = useAuth()
  const { settings, update, save } = useSettings()
  const [saved, setSaved] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 60)
      return () => clearTimeout(t)
    }
  }, [loading])

  const handleSave = () => {
    save()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <LoadingScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav user={user} />

      <main style={{
        maxWidth:    640,
        margin:      '0 auto',
        padding:     'calc(var(--nav-h) + 48px) 24px 80px',
        opacity:     visible ? 1 : 0,
        transform:   visible ? 'translateY(0)' : 'translateY(14px)',
        transition:  'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <h1 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     '28px',
          fontWeight:   300,
          color:        'var(--text)',
          marginBottom: '6px',
          letterSpacing: '-0.01em',
        }}>
          Settings
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 36, fontWeight: 300 }}>
          Configure how QuickNotes captures and summarizes your lectures.
        </p>

        {/* Transcription section */}
        <Section title="Transcription">
          <SettingRow
            label="Transcription Engine"
            description="The speech-to-text model used to transcribe audio chunks."
          >
            <Badge label="whisper-1" />
          </SettingRow>

          <SettingRow
            label="Max Chunk Duration"
            description="Maximum recording duration before a forced chunk submission."
          >
            <Select
              value={settings.chunkDuration}
              onChange={v => update({ chunkDuration: v })}
              options={[
                { value: '30', label: '30 seconds' },
                { value: '45', label: '45 seconds (default)' },
                { value: '60', label: '60 seconds' },
              ]}
            />
          </SettingRow>
        </Section>

        {/* AI Notes section */}
        <Section title="AI Notes">
          <SettingRow
            label="Summarization Interval"
            description="How often AI generates new notes during an active session."
          >
            <Select
              value={settings.summarizeInterval}
              onChange={v => update({ summarizeInterval: v })}
              options={[
                { value: '30', label: '30 seconds' },
                { value: '45', label: '45 seconds (default)' },
                { value: '60', label: '60 seconds' },
                { value: '90', label: '90 seconds' },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Rolling Window"
            description="How much recent transcript context is sent to the AI each summarization."
          >
            <Select
              value={settings.rollingWindow}
              onChange={v => update({ rollingWindow: v })}
              options={[
                { value: '60',  label: '1 minute' },
                { value: '150', label: '2.5 minutes (default)' },
                { value: '300', label: '5 minutes' },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Summarize on Stop"
            description="Run a final summarization pass when you stop recording."
          >
            <Toggle
              value={settings.summarizeOnStop}
              onChange={v => update({ summarizeOnStop: v })}
            />
          </SettingRow>
        </Section>

        {/* Account section */}
        <Section title="Account">
          <SettingRow
            label="Signed in as"
            description={user?.email || ''}
          >
            <a
              href="/auth/logout"
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          6,
                padding:      '7px 14px',
                borderRadius: 'var(--radius)',
                background:   'var(--red-dim)',
                color:        'var(--red)',
                border:       '1px solid rgba(224,92,92,0.2)',
                fontSize:     '13px',
                fontWeight:   500,
                textDecoration: 'none',
                transition:   'all 0.15s',
                whiteSpace:   'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
            >
              Sign Out
            </a>
          </SettingRow>
        </Section>

        {/* Save button */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleSave}
            style={{
              padding:      '11px 24px',
              borderRadius: 'var(--radius)',
              background:   saved ? 'rgba(76,175,125,0.15)' : 'var(--accent)',
              border:       saved ? '1px solid rgba(76,175,125,0.3)' : 'none',
              color:        saved ? 'var(--green)' : '#fff',
              fontSize:     '14px',
              fontWeight:   500,
              cursor:       'pointer',
              transition:   'all 0.15s',
              minWidth:     140,
            }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{
        fontSize:     '11px',
        fontWeight:   600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:        'var(--text-muted)',
        marginBottom: 12,
      }}>
        {title}
      </p>
      <div style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border)',
        borderRadius: '12px',
        overflow:     'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            '20px',
      padding:        '16px 20px',
      borderBottom:   '1px solid var(--border)',
    }}
    className="setting-row"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        {description && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>

      <style>{`.setting-row:last-child { border-bottom: none; }`}</style>
    </div>
  )
}

function Badge({ label }) {
  return (
    <span style={{
      padding:      '5px 10px',
      borderRadius: '6px',
      background:   'var(--bg-elevated)',
      border:       '1px solid var(--border)',
      color:        'var(--text-mid)',
      fontSize:     '12px',
      fontFamily:   'var(--font-mono)',
      fontWeight:   500,
    }}>
      {label}
    </span>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding:      '7px 30px 7px 12px',
        borderRadius: 'var(--radius)',
        background:   'var(--bg-elevated)',
        border:       '1px solid var(--border)',
        color:        'var(--text)',
        fontSize:     '13px',
        cursor:       'pointer',
        outline:      'none',
        appearance:   'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238C7D73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width:        '44px',
        height:       '24px',
        borderRadius: '12px',
        background:   value ? 'var(--accent)' : 'var(--bg-elevated)',
        border:       `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        position:     'relative',
        cursor:       'pointer',
        transition:   'background 0.2s, border-color 0.2s',
      }}
    >
      <span style={{
        position:   'absolute',
        top:        '50%',
        left:       value ? 'calc(100% - 20px)' : '2px',
        transform:  'translateY(-50%)',
        width:      18,
        height:     18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow:  '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
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
