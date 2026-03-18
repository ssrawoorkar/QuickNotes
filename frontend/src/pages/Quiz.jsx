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

function Spinner() {
  return (
    <>
      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

// ── Selection View ──────────────────────────────────────────────────────────

function SelectionView({ onGenerate, visible }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError('Please paste your notes before generating a quiz.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate quiz. Please try again.')
        setLoading(false)
        return
      }
      onGenerate(data.questions)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{
      maxWidth:   640,
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
        Quiz Yourself
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 36, fontWeight: 300 }}>
        Test your knowledge from your notes.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{
          display:      'block',
          fontSize:     '13px',
          fontWeight:   500,
          color:        'var(--text-mid)',
          marginBottom: 8,
        }}>
          Paste your notes
        </label>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setError('') }}
          placeholder="Paste your AI-generated lecture notes here…"
          style={{
            width:        '100%',
            minHeight:    '240px',
            padding:      '14px 16px',
            borderRadius: 'var(--radius)',
            background:   'var(--bg-card)',
            border:       `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            color:        'var(--text)',
            fontSize:     '14px',
            lineHeight:   1.65,
            resize:       'vertical',
            outline:      'none',
            transition:   'border-color 0.15s ease',
            fontFamily:   'var(--font-body)',
          }}
          onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: 16 }}>{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '13px 28px',
          borderRadius: 'var(--radius)',
          background:   'var(--accent)',
          color:        '#fff',
          fontSize:     '15px',
          fontWeight:   500,
          border:       'none',
          cursor:       loading ? 'not-allowed' : 'pointer',
          opacity:      loading ? 0.75 : 1,
          transition:   'background 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
      >
        {loading && <Spinner />}
        {loading ? 'Generating questions…' : 'Generate Quiz'}
      </button>
    </main>
  )
}

// ── Question View ───────────────────────────────────────────────────────────

const CHOICE_KEYS = ['A', 'B', 'C', 'D']

function QuestionView({ questions, onRestart, user }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(true)

  const q = questions[index]
  const total = questions.length
  const answered = selected !== null
  const isCorrect = answered && selected === q.correct

  const handleSelect = (key) => {
    if (answered) return
    setSelected(key)
    if (key === q.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (index + 1 >= total) {
      setDone(true)
      return
    }
    setVisible(false)
    setTimeout(() => {
      setIndex(i => i + 1)
      setSelected(null)
      setVisible(true)
    }, 200)
  }

  const handleRestart = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setDone(false)
    setVisible(true)
  }

  const scorePercent = Math.round((score / total) * 100)

  // Score screen
  if (done) {
    const msg = scorePercent >= 90
      ? 'Excellent work! You really know this material.'
      : scorePercent >= 70
      ? 'Good job! A bit more review and you\'ll have it mastered.'
      : scorePercent >= 50
      ? 'Not bad — keep studying and try again.'
      : 'This material needs more attention. Review your notes and try again.'

    return (
      <main style={{
        maxWidth:   580,
        margin:     '0 auto',
        padding:    'calc(var(--nav-h) + 64px) 24px 80px',
        textAlign:  'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: 20 }}>
          {scorePercent >= 90 ? '🎉' : scorePercent >= 70 ? '👍' : scorePercent >= 50 ? '📖' : '💪'}
        </div>
        <h1 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '32px',
          fontWeight:    300,
          color:         'var(--text)',
          marginBottom:  12,
          letterSpacing: '-0.01em',
        }}>
          {score} / {total}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-mid)', marginBottom: 8 }}>
          {scorePercent}% correct
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 40px' }}>
          {msg}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRestart}
            style={{
              padding:      '12px 24px',
              borderRadius: 'var(--radius)',
              background:   'var(--accent)',
              color:        '#fff',
              fontSize:     '14px',
              fontWeight:   500,
              border:       'none',
              cursor:       'pointer',
              transition:   'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            Try Again
          </button>
          <Link
            to="/home"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              padding:        '12px 24px',
              borderRadius:   'var(--radius)',
              background:     'var(--bg-elevated)',
              border:         '1px solid var(--border)',
              color:          'var(--text)',
              fontSize:       '14px',
              fontWeight:     500,
              textDecoration: 'none',
              transition:     'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  const getChoiceStyle = (key) => {
    const base = {
      width:        '100%',
      textAlign:    'left',
      padding:      '14px 18px',
      borderRadius: 'var(--radius)',
      fontSize:     '14px',
      fontWeight:   400,
      lineHeight:   1.5,
      cursor:       answered ? 'default' : 'pointer',
      border:       '1px solid var(--border)',
      transition:   'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      display:      'flex',
      gap:          12,
      alignItems:   'flex-start',
    }
    if (!answered) {
      return { ...base, background: 'var(--bg-card)', color: 'var(--text)' }
    }
    if (key === q.correct) {
      return { ...base, background: 'rgba(76,175,125,0.15)', border: '1px solid rgba(76,175,125,0.4)', color: 'var(--text)' }
    }
    if (key === selected) {
      return { ...base, background: 'var(--red-dim)', border: '1px solid rgba(224,92,92,0.4)', color: 'var(--text)' }
    }
    return { ...base, background: 'var(--bg-card)', color: 'var(--text-muted)', opacity: 0.6 }
  }

  return (
    <main style={{
      maxWidth:   640,
      margin:     '0 auto',
      padding:    'calc(var(--nav-h) + 32px) 24px 80px',
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Question {index + 1} of {total}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {score} correct
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height:     '100%',
            width:      `${((index + 1) / total) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Question */}
      <h2 style={{
        fontFamily:    'var(--font-display)',
        fontSize:      'clamp(18px, 3vw, 24px)',
        fontWeight:    300,
        color:         'var(--text)',
        lineHeight:    1.4,
        marginBottom:  28,
        letterSpacing: '-0.01em',
      }}>
        {q.question}
      </h2>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {CHOICE_KEYS.map(key => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            style={getChoiceStyle(key)}
          >
            <span style={{
              fontWeight:   600,
              color:        'var(--accent)',
              fontSize:     '13px',
              flexShrink:   0,
              minWidth:     18,
            }}>{key}</span>
            <span>{q.choices[key]}</span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div style={{
          padding:      '14px 16px',
          borderRadius: 'var(--radius)',
          background:   isCorrect ? 'rgba(76,175,125,0.1)' : 'var(--red-dim)',
          border:       `1px solid ${isCorrect ? 'rgba(76,175,125,0.3)' : 'rgba(224,92,92,0.25)'}`,
          marginBottom: 20,
        }}>
          {isCorrect ? (
            <>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>
                ✓ Correct!
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                {q.explanation}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>
                The correct answer is {q.correct}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 8 }}>
                {q.explanation}
              </p>
              {q.wrong_explanations?.[selected] && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <strong style={{ color: 'var(--text-mid)' }}>Why {selected} is wrong:</strong> {q.wrong_explanations[selected]}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Next */}
      {answered && (
        <button
          onClick={handleNext}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          8,
            padding:      '12px 24px',
            borderRadius: 'var(--radius)',
            background:   'var(--accent)',
            color:        '#fff',
            fontSize:     '14px',
            fontWeight:   500,
            border:       'none',
            cursor:       'pointer',
            transition:   'background 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none' }}
        >
          {index + 1 >= total ? 'See Results' : 'Next Question →'}
        </button>
      )}
    </main>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function Quiz() {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [questions, setQuestions] = useState(null)

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
      {questions
        ? <QuestionView questions={questions} onRestart={() => setQuestions(null)} user={user} />
        : <SelectionView onGenerate={setQuestions} visible={visible} />
      }
    </div>
  )
}
