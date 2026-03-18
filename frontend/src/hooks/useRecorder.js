import { useState, useRef, useCallback } from 'react'

const SILENCE_THRESHOLD = 0.015
const SILENCE_DURATION  = 300   // ms
const MIN_CHUNK_MS      = 1000
const MAX_CHUNK_MS      = 45000 // hard cap

/**
 * Gets the best supported mimeType for MediaRecorder.
 * Preference: webm;codecs=opus → webm → ogg → mp4
 */
function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

/**
 * Formats elapsed seconds into "Xs" or "Xm Ys".
 */
function formatTimestamp(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

/**
 * Implements silence-based MediaRecorder chunking.
 * @param {function} onTranscript - Called with { timestamp, text } on each chunk
 * @param {function} onSend       - Called with { action, timestamp, text } to forward via WS
 * @returns {{ isRecording: boolean, start: function, stop: function, transcript: Array }}
 */
export function useRecorder({ onTranscript, onSend }) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState([])

  const streamRef       = useRef(null)
  const audioCtxRef     = useRef(null)
  const analyserRef     = useRef(null)
  const recorderRef     = useRef(null)
  const chunksRef       = useRef([])
  const mimeTypeRef     = useRef('')
  const chunkStartRef   = useRef(0)
  const sessionStartRef = useRef(0)
  const silenceTimerRef = useRef(null)
  const maxTimerRef     = useRef(null)
  const animFrameRef    = useRef(null)
  const isRecordingRef  = useRef(false)

  /**
   * Flushes the current MediaRecorder chunk: stops the current recorder,
   * starts a new one immediately (zero gap), then sends the blob.
   */
  const flushChunk = useCallback((isFinal = false) => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    const now = Date.now()
    const elapsed = now - chunkStartRef.current
    if (elapsed < MIN_CHUNK_MS && !isFinal) return

    // Clear any pending timers
    clearTimeout(silenceTimerRef.current)
    clearTimeout(maxTimerRef.current)
    silenceTimerRef.current = null
    maxTimerRef.current = null

    // Capture blob when stop fires
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      chunksRef.current = []

      if (blob.size < 500) return // skip tiny blobs

      // Build timestamp relative to session start
      const offsetSec = Math.floor((now - sessionStartRef.current) / 1000)
      const ts = formatTimestamp(offsetSec)

      try {
        const fd = new FormData()
        fd.append('audio', blob, `chunk.${mimeTypeRef.current.includes('webm') ? 'webm' : mimeTypeRef.current.includes('ogg') ? 'ogg' : 'mp4'}`)
        const res = await fetch('/transcribe', { method: 'POST', body: fd })
        const data = await res.json()
        const text = (data.text || '').trim()

        if (text && text.split(/\s+/).length >= 4) {
          const entry = { timestamp: ts, text }
          setTranscript(prev => [...prev, entry])
          if (onTranscript) onTranscript(entry)
          if (onSend) onSend({ action: 'transcript', timestamp: ts, text })
        }
      } catch (err) {
        console.warn('Transcription error:', err)
      }
    }

    recorder.stop()

    // Start a new recorder immediately (unless final)
    if (!isFinal && isRecordingRef.current && streamRef.current) {
      chunkStartRef.current = Date.now()
      const newRecorder = new MediaRecorder(streamRef.current, { mimeType: mimeTypeRef.current })
      newRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      newRecorder.start(100)
      recorderRef.current = newRecorder

      // Schedule max-duration flush
      maxTimerRef.current = setTimeout(() => flushChunk(false), MAX_CHUNK_MS)
    }
  }, [onTranscript, onSend])

  /**
   * Monitors audio levels using an AnalyserNode.
   * Triggers flushChunk when silence is detected.
   */
  const monitorSilence = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser || !isRecordingRef.current) return

    const buffer = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buffer)

    // RMS level
    let sumSq = 0
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i]
    const rms = Math.sqrt(sumSq / buffer.length)

    if (rms < SILENCE_THRESHOLD) {
      // Silence detected — start/maintain silence timer
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null
          flushChunk(false)
        }, SILENCE_DURATION)
      }
    } else {
      // Sound detected — cancel silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }

    animFrameRef.current = requestAnimationFrame(monitorSilence)
  }, [flushChunk])

  const start = useCallback(async () => {
    if (isRecordingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      // Audio context for silence detection
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      mimeTypeRef.current = getSupportedMimeType()
      chunkStartRef.current = Date.now()
      sessionStartRef.current = Date.now()
      isRecordingRef.current = true
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(100)
      recorderRef.current = recorder

      // Schedule max-duration flush
      maxTimerRef.current = setTimeout(() => flushChunk(false), MAX_CHUNK_MS)

      // Begin silence monitoring
      animFrameRef.current = requestAnimationFrame(monitorSilence)

      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      throw err
    }
  }, [flushChunk, monitorSilence])

  const stop = useCallback(() => {
    if (!isRecordingRef.current) return

    isRecordingRef.current = false
    setIsRecording(false)

    // Stop animation loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    clearTimeout(silenceTimerRef.current)
    clearTimeout(maxTimerRef.current)
    silenceTimerRef.current = null
    maxTimerRef.current = null

    // Final chunk flush
    flushChunk(true)

    // Clean up audio context
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
      analyserRef.current = null
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [flushChunk])

  const clearTranscript = useCallback(() => {
    setTranscript([])
  }, [])

  return { isRecording, start, stop, transcript, clearTranscript }
}
