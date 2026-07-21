import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

// ─── Constants ───────────────────────────────────────────────────────────────
const AUTOSAVE_INTERVAL_MS = 15_000          // save every 15 s
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID

// ─── Pre-flight Gate: handles setup steps before exam starts ─────────────────
function PreflightGate({ exam, onReady }) {
  const [step, setStep] = useState('extension') // extension → camera → fullscreen → ready
  const [extOk, setExtOk] = useState(false)
  const [camOk, setCamOk] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)

  // 1. Check extension presence via externally_connectable PING
  useEffect(() => {
    // Helper to bypass extension step
    const bypassExtension = (msg) => {
      console.warn(msg)
      setExtOk(false) // Not installed
      setStep('camera') // Move forward anyway
    }

    if (!EXTENSION_ID || EXTENSION_ID === 'REPLACE_WITH_EXTENSION_ID') {
      bypassExtension('VITE_EXTENSION_ID not configured. Bypassing extension check.')
      return
    }

    const timeout = setTimeout(() => {
      bypassExtension('Extension timeout. Bypassing check.')
    }, 2000)

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (resp) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeout)
            bypassExtension('Extension not found. Bypassing check.')
            return
          }
          if (resp?.type === 'PONG') {
            clearTimeout(timeout)
            setExtOk(true)
            setError('')
            setStep('camera')
          }
        })
      } catch {
        clearTimeout(timeout)
        bypassExtension('Error connecting to extension. Bypassing check.')
      }
    } else {
      clearTimeout(timeout)
      bypassExtension('chrome.runtime not available. Bypassing check.')
    }

    return () => clearTimeout(timeout)
  }, [])

  // 2. Request camera + mic
  async function requestCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) videoRef.current.srcObject = stream
      setCamOk(true)
      setStep('fullscreen')
    } catch {
      setError('Camera and microphone access are required. Please allow and try again.')
    }
  }

  // 3. Go fullscreen
  async function goFullscreen() {
    setError('')
    try {
      await document.documentElement.requestFullscreen()
      onReady(videoRef.current?.srcObject)
    } catch {
      setError('Fullscreen mode is required. Please allow and try again.')
    }
  }

  const steps = [
    { key: 'extension', label: 'Extension', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v4m-16-4v4m3-12h10m-10 4h10"/></svg> },
    { key: 'camera', label: 'Camera & Mic', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"/><circle cx="12" cy="13" r="4"/></svg> },
    { key: 'fullscreen', label: 'Fullscreen', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg> },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 560 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{exam.title}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Duration: <b>{exam.duration_minutes} min</b> &nbsp;&bull;&nbsp; Complete setup to begin
          </p>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '0 2rem' }}>
          {steps.map((s, i) => {
            const idx = steps.findIndex(x => x.key === step)
            const done = i < idx || (s.key === 'extension' && extOk) || (s.key === 'camera' && camOk)
            const active = s.key === step
            
            return (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: 1, position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', top: 24, left: '-50%', width: '100%', height: 2, background: done ? 'var(--primary)' : 'var(--border)', zIndex: 0 }}></div>
                )}
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: 48, height: 48, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: done ? 'var(--primary)' : active ? 'var(--primary-soft)' : 'var(--bg-main)',
                  color: done ? 'white' : active ? 'var(--primary-dark)' : 'var(--text-muted)',
                  border: `2px solid ${done || active ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: active ? '0 0 0 4px var(--primary-soft)' : 'none'
                }}>
                  {done ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : s.icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: active || done ? 'var(--text-h)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Main Card */}
        <div className="card-flat" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          {step === 'extension' && (
            <div className="fade-in">
              <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', borderRadius: 20, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v4m-16-4v4m3-12h10m-10 4h10"/></svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>Checking Extension…</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500, margin: '0 auto', maxWidth: 360 }}>
                The SecureExam browser extension is required to prevent tab switching and ensure exam integrity.
              </p>
            </div>
          )}

          {step === 'camera' && (
            <div className="fade-in">
              <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', borderRadius: 20, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>Camera & Microphone</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500, margin: '0 auto 1.5rem', maxWidth: 380 }}>
                Your camera is used for live proctoring. The microphone checks for audio anomalies during the exam.
              </p>
              
              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 16, padding: '0.5rem', marginBottom: '1.5rem' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, display: camOk ? 'block' : 'none', background: '#000' }} />
                {!camOk && (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                    Camera preview will appear here
                  </div>
                )}
              </div>
              
              <button id="grant-camera" onClick={requestCamera} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                {camOk ? '✓ Camera Ready' : 'Grant Camera & Mic Access'}
              </button>
            </div>
          )}

          {step === 'fullscreen' && (
            <div className="fade-in">
              <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', borderRadius: 20, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>Fullscreen Required</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500, margin: '0 auto 2rem', maxWidth: 360 }}>
                The exam must be taken in fullscreen mode. Exiting fullscreen during the exam will be logged as a violation flag.
              </p>
              <button id="go-fullscreen" onClick={goFullscreen} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                Enter Fullscreen & Start Exam
              </button>
            </div>
          )}

          {error && (
            <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const ref = useRef(null)

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(p => {
        if (p <= 1) { clearInterval(ref.current); onExpire(); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60
  const pct = remaining / totalSeconds
  const urgent = pct < 0.15

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 1rem', borderRadius: 12,
      fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
      transition: 'all 0.3s',
      color: urgent ? 'var(--danger)' : 'var(--text-h)',
      background: urgent ? 'var(--danger-soft)' : 'var(--bg-main)',
      border: `1.5px solid ${urgent ? 'rgba(239,68,68,.3)' : 'var(--border)'}`,
    }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {h > 0 && `${h}:`}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  )
}

// ─── Question Renderer ────────────────────────────────────────────────────────
function QuestionView({ question, answer, onChange }) {
  if (question.type === 'mcq') {
    return (
      <div className="space-y-3">
        {question.options?.map((opt, i) => (
          <label key={i} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
            ${answer === opt ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-main)]'}`}>
            <input type="radio" name={`q-${question.id}`} value={opt} checked={answer === opt}
              onChange={() => onChange(opt)} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
            <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'true_false') {
    return (
      <div className="flex gap-4">
        {['true', 'false'].map(v => (
          <label key={v} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all capitalize
            ${answer === v ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]' : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-h)] bg-[var(--bg-main)]'}`}>
            <input type="radio" name={`q-${question.id}`} value={v} checked={answer === v}
              onChange={() => onChange(v)} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>{v === 'true' ? '✓ True' : '✗ False'}</span>
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'numeric') {
    return (
      <input type="number" className="input-field text-lg" placeholder="Enter your numeric answer"
        value={answer || ''} onChange={e => onChange(e.target.value)} />
    )
  }

  // subjective
  return (
    <textarea className="input-field text-base" rows={6} placeholder="Write your answer here…"
      value={answer || ''} onChange={e => onChange(e.target.value)} />
  )
}

// ─── Proctoring Engine (MediaPipe + Grace Period) ─────────────────────────────
const GRACE_PERIOD_MS = 3000 // 3s before a nudge becomes a flag
const NUDGE_DELAY_MS = 1000  // 1s before showing the nudge

function ProctoringEngine({ examId, stream, onNudge, isSubmitting }) {
  const canvasRef = useRef(document.createElement('canvas'))
  const videoRef = useRef(document.createElement('video'))
  const faceLandmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const issueStartRef = useRef(null) // timestamp when issue first detected
  const nudgeShownRef = useRef(false)
  const lastFlagTimeRef = useRef(0) // debounce: don't spam flags

  // Setup video element
  useEffect(() => {
    if (stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current
    if (!video.videoWidth) return null
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.5)
  }, [])

  const logViolation = useCallback(async (type, detail) => {
    // Debounce: only one flag of the same type per 5 seconds
    const now = Date.now()
    if (now - lastFlagTimeRef.current < 5000) return
    lastFlagTimeRef.current = now

    try {
      const snapshot = takeSnapshot()
      await api.post(`/exams/${examId}/proctoring/flag`, {
        source: 'client_check',
        flagType: type,
        detail,
        snapshotKey: snapshot
      })
    } catch (err) {
      console.error('Failed to log violation', err)
    }
  }, [examId, takeSnapshot])

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    let cancelled = false

    async function initFaceLandmarker() {
      try {
        const vision = await import('@mediapipe/tasks-vision')
        const { FaceLandmarker, FilesetResolver } = vision

        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 3
        })

        if (!cancelled) {
          faceLandmarkerRef.current = landmarker
          console.log('FaceLandmarker initialized')
        }
      } catch (err) {
        console.warn('MediaPipe FaceLandmarker init failed, falling back to basic monitoring:', err)
      }
    }

    initFaceLandmarker()
    return () => { cancelled = true }
  }, [])

  // Main detection loop
  useEffect(() => {
    let running = true

    function detect() {
      if (!running) return

      const video = videoRef.current
      const landmarker = faceLandmarkerRef.current

      if (landmarker && video.readyState >= 2) {
        const now = performance.now()
        try {
          const result = landmarker.detectForVideo(video, now)
          const faceCount = result.faceLandmarks?.length || 0

          let issue = null

          if (faceCount === 0) {
            issue = { type: 'no_face', detail: 'No face detected in camera frame.' }
          } else if (faceCount > 1) {
            issue = { type: 'multiple_faces', detail: `${faceCount} faces detected — only 1 allowed.` }
          } else if (result.facialTransformationMatrixes?.length > 0) {
            // Check head pose via the transformation matrix
            const matrix = result.facialTransformationMatrixes[0].data
            // Extract approximate yaw and pitch from the 4x4 matrix
            // matrix[0..3] = row 0, matrix[4..7] = row 1, etc.
            const yaw = Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI)
            const pitch = Math.atan2(-matrix[9], Math.sqrt(matrix[8] * matrix[8] + matrix[10] * matrix[10])) * (180 / Math.PI)

            if (Math.abs(yaw) > 35 || Math.abs(pitch) > 30) {
              issue = { type: 'looking_away', detail: `Head turned: yaw=${yaw.toFixed(1)}° pitch=${pitch.toFixed(1)}°` }
            }
          }

          if (issue) {
            // Issue detected — start or continue the grace period
            if (!issueStartRef.current) {
              issueStartRef.current = Date.now()
            }

            const elapsed = Date.now() - issueStartRef.current

            // After 1s, show local nudge
            if (elapsed > NUDGE_DELAY_MS && !nudgeShownRef.current) {
              nudgeShownRef.current = true
              onNudge(issue.type === 'no_face'
                ? 'Please look at the screen — your face is not visible.'
                : issue.type === 'multiple_faces'
                  ? 'Multiple faces detected. Please ensure only you are visible.'
                  : 'Please face the screen directly.')
            }

            // After 3s, log formal violation
            if (elapsed > GRACE_PERIOD_MS) {
              let flagType = issue.type
              if (flagType === 'looking_away') flagType = 'look_away'
              if (flagType === 'no_face') flagType = 'no_face_detected'
              if (flagType === 'multiple_faces') flagType = 'multiple_faces_detected'

              logViolation(flagType, issue.detail)
              // Reset timer so it doesn't spam
              issueStartRef.current = Date.now()
              nudgeShownRef.current = false
            }
          } else {
            // Face is fine — clear grace period
            if (issueStartRef.current) {
              issueStartRef.current = null
              nudgeShownRef.current = false
            }
          }
        } catch (err) {
          // Detection can fail on some frames, just skip
        }
      }

      rafRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [logViolation, onNudge])

  // Monitor visibility (tab switching) — also kept as a client-side fallback
  useEffect(() => {
    const handleVisibility = () => {
      if (isSubmitting) return
      if (document.hidden) {
        logViolation('tab_switched', 'User switched to another tab or minimized the browser.')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [logViolation, isSubmitting])

  // Monitor extension messages (clipboard blocked by extension)
  useEffect(() => {
    const handleMessage = (e) => {
      if (isSubmitting) return
      if (e.data && e.data.type === 'SECURE_EXAM_VIOLATION') {
        logViolation('extension_flag', `Violation caught by extension: ${e.data.violation}`)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [logViolation, isSubmitting])

  // Monitor fullscreen
  useEffect(() => {
    const handleFullscreen = () => {
      if (isSubmitting) return
      if (!document.fullscreenElement) {
        logViolation('fullscreen_exit', 'User exited fullscreen mode.')
        onNudge('You exited fullscreen mode. This has been logged as a violation.')
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [logViolation, onNudge, isSubmitting])

  // AI Microservice Snapshot & Audio Interval (Every 10s)
  useEffect(() => {
    if (!stream) return
    let intervalId

    const processAI = async () => {
      try {
        const video = videoRef.current
        if (!video || !video.videoWidth) return

        // 1. Record 3 seconds of audio
        const audioTracks = stream.getAudioTracks()
        let audioBlob = null

        if (audioTracks.length > 0) {
          const audioStream = new MediaStream([audioTracks[0]])
          const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' })
          const audioChunks = []

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data)
          }

          const audioPromise = new Promise((resolve) => {
            mediaRecorder.onstop = () => {
              resolve(new Blob(audioChunks, { type: 'audio/webm' }))
            }
          })

          mediaRecorder.start()
          setTimeout(() => mediaRecorder.stop(), 3000) // Record for 3s
          audioBlob = await audioPromise
        } else {
          // Fallback if no audio track (shouldn't happen because of PreflightGate, but just in case)
          await new Promise(r => setTimeout(r, 3000))
        }

        // 2. Take video snapshot
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const snapshotBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.5))
        if (!snapshotBlob) return

        // 3. Upload both to backend
        const formData = new FormData()
        formData.append('snapshot', snapshotBlob, 'snapshot.jpg')
        if (audioBlob) {
          formData.append('audio', audioBlob, 'audio.webm')
        }
        
        await api.post(`/exams/${examId}/proctoring/snapshot`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (err) {
        console.error('AI snapshot interval error', err)
      }
    }

    // Run first check immediately, then every 10s
    if (!isSubmitting) {
      processAI()
      intervalId = setInterval(processAI, 10000)
    }

    return () => clearInterval(intervalId)
  }, [examId, stream, isSubmitting])

  return null // Headless component
}

// ─── Main ExamRoom ────────────────────────────────────────────────────────────
export default function ExamRoom() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [studentStartTime, setStudentStartTime] = useState(Date.now())
  const [phase, setPhase] = useState('loading') // loading | preflight | exam | submitted
  const [savingStatus, setSavingStatus] = useState('saved') // saved | saving | error
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [nudge, setNudge] = useState(null) // { message }
  const [mediaStream, setMediaStream] = useState(null)

  const answersRef = useRef({})

  // ── Load exam data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/exams/${examId}`)
        setExam(data.exam)
        setQuestions(data.questions)

        // Restore from local storage autosave
        const saved = localStorage.getItem(`exam_answers_${examId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          setAnswers(parsed)
          answersRef.current = parsed
        }

        // Try to fetch existing submission in-progress from server
        try {
          const subRes = await api.get(`/submissions/${examId}`)
          if (subRes.data?.submission?.answers) {
            const serverAnswers = subRes.data.submission.answers
            setAnswers(serverAnswers)
            answersRef.current = serverAnswers
          }
          if (subRes.data?.submission?.started_at) {
            setStudentStartTime(new Date(subRes.data.submission.started_at).getTime())
          }
          if (subRes.data?.submission?.submitted_at) {
            setPhase('submitted')
            return
          }
        } catch { /* no submission yet – fine */ }

        setPhase('preflight')
      } catch (err) {
        console.error(err)
        setPhase('error')
      }
    }
    load()
  }, [examId])

  // ── Autosave ────────────────────────────────────────────────────────────
  const saveProgress = useCallback(async () => {
    setSavingStatus('saving')
    try {
      localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(answersRef.current))
      await api.post(`/submissions/${examId}/autosave`, { answers: answersRef.current })
      setSavingStatus('saved')
    } catch {
      setSavingStatus('error')
    }
  }, [examId])

  useEffect(() => {
    if (phase !== 'exam') return
    const interval = setInterval(saveProgress, AUTOSAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [phase, saveProgress])

  // (Fullscreen exit detection is handled by ProctoringEngine component)

  // ── Update answer ───────────────────────────────────────────────────────
  function handleAnswer(qId, value) {
    const updated = { ...answersRef.current, [qId]: value }
    answersRef.current = updated
    setAnswers(updated)
    setSavingStatus('saved') // will re-debounce
    // Immediate localStorage save
    localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(updated))
  }

  // ── Submit exam ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) return
    setSubmitting(true)
    setSubmitError('')
    
    let retries = 3;
    let success = false;
    let lastErr = null;

    while (retries > 0 && !success) {
      try {
        await api.post(`/submissions/${examId}/submit`, { answers: answersRef.current })
        success = true;
      } catch (err) {
        lastErr = err;
        retries--;
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds before retry
        }
      }
    }

    if (!success) {
      setSubmitError(lastErr?.response?.data?.error || 'Submission failed after retries. Check connection and try again.')
      setSubmitting(false)
      return
    }

    // Success path
    localStorage.removeItem(`exam_answers_${examId}`)
    // Exit fullscreen gracefully
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    // Tell extension to stop monitoring
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try { chrome.runtime.sendMessage(EXTENSION_ID, { type: 'END_EXAM' }) } catch {}
    }
    setPhase('submitted')
    setSubmitting(false)
  }

  // ── Render states ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Preparing Exam Environment…</div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
        <div className="card-flat fade-in" style={{ padding: '3.5rem 3rem', textAlign: 'center', maxWidth: 460 }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 1.5rem', borderRadius: 24, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '2rem' }}>
            You may not be enrolled in this exam, or the scheduled time window has closed.
          </p>
          <button onClick={() => navigate('/dashboard/student')} className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
        <div className="card-flat fade-in" style={{ padding: '4rem 3rem', textAlign: 'center', maxWidth: 500 }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 1.75rem', borderRadius: 24, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Exam Submitted Successfully</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '2.5rem' }}>
            Your answers have been securely recorded. You may now close this window or return to your dashboard.
          </p>
          <button onClick={() => navigate('/dashboard/student')} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'preflight') {
    return <PreflightGate exam={exam} onReady={(stream) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const token = localStorage.getItem('token') || ''
        chrome.runtime.sendMessage(EXTENSION_ID, {
          type: 'START_EXAM',
          examId: exam.id,
          token: token,
          apiUrl: 'http://localhost:5000'
        }, (resp) => {
          if (resp?.status === 'started') {
            setMediaStream(stream)
            setPhase('exam')
          } else {
            alert('Failed to start exam via extension.')
          }
        })
      }
    }} />
  }

  // ── EXAM PHASE ──────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx]
  
  // Calculate remaining time based on student's actual start time and duration
  const totalSeconds = exam.duration_minutes * 60
  const elapsed = Math.floor((Date.now() - studentStartTime) / 1000)
  let remaining = Math.max(0, totalSeconds - elapsed)

  // Cap remaining time to the exam's hard end_time
  const secondsUntilExamCloses = Math.floor((new Date(exam.end_time).getTime() - Date.now()) / 1000)
  remaining = Math.min(remaining, Math.max(0, secondsUntilExamCloses))

  const answeredCount = Object.keys(answers).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflow: 'hidden' }}>
      
      {/* Proctoring Engine */}
      <ProctoringEngine examId={examId} stream={mediaStream} onNudge={msg => setNudge({message: msg})} isSubmitting={submitting || phase === 'submitted'} />

      {/* Fullscreen nudge overlay */}
      {nudge && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="card-flat fade-in" style={{ padding: '3rem', maxWidth: 460, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', borderRadius: 20, background: 'var(--warning-soft)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>Fullscreen Required</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '2rem' }}>{nudge.message}</p>
            <button onClick={() => {
              document.documentElement.requestFullscreen().then(() => setNudge(null)).catch(() => {})
            }} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>Return to Fullscreen</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>{exam.title}</h1>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{answeredCount} of {questions.length} answered</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: savingStatus === 'saving' ? 'var(--warning)' : savingStatus === 'error' ? 'var(--danger)' : 'var(--success)', background: savingStatus === 'saving' ? 'var(--warning-soft)' : savingStatus === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)', padding: '0.4rem 0.8rem', borderRadius: 8 }}>
            {savingStatus === 'saving' ? '⟳ Saving…' : savingStatus === 'error' ? '✗ Save failed' : '✓ Saved'}
          </span>
          <Timer totalSeconds={remaining} onExpire={handleSubmit} />
          <button id="submit-exam" onClick={handleSubmit} className="btn btn-danger" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar: question navigator */}
        <aside style={{ width: 260, padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-main)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Questions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {questions.map((q, i) => (
              <button key={q.id} id={`nav-q-${i+1}`}
                onClick={() => setCurrentIdx(i)}
                style={{
                  height: 42, borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s',
                  background: i === currentIdx ? 'var(--primary)' : answers[q.id] ? 'var(--success-soft)' : 'var(--bg-main)',
                  color: i === currentIdx ? 'white' : answers[q.id] ? 'var(--success)' : 'var(--text-muted)',
                  border: `1.5px solid ${i === currentIdx ? 'var(--primary)' : answers[q.id] ? 'var(--success)' : 'var(--border)'}`,
                  cursor: 'pointer'
                }}>
                {i + 1}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary)' }} /> Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--success-soft)', border: '1.5px solid var(--success)' }} /> Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--bg-main)', border: '1.5px solid var(--border)' }} /> Not answered
            </div>
          </div>
        </aside>

        {/* Main question area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', background: 'var(--bg-main)' }}>
          {currentQ && (
            <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: 'white', background: 'var(--primary)' }}>
                  {currentIdx + 1}
                </span>
                <span className={`badge ${currentQ.type === 'mcq' ? 'badge-primary' : currentQ.type === 'true_false' ? 'badge-info' : currentQ.type === 'numeric' ? 'badge-warning' : 'badge-success'}`}>
                  {currentQ.type.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {currentQ.points} point{currentQ.points !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Question text */}
              <div className="card-flat" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.15rem', color: 'var(--text-h)', lineHeight: 1.6, fontWeight: 500 }}>
                  {currentQ.question_text}
                </p>
              </div>

              {/* Answer input */}
              <div className="card-flat" style={{ padding: '2rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>Your Answer</p>
                <QuestionView question={currentQ} answer={answers[currentQ.id] || ''}
                  onChange={val => handleAnswer(currentQ.id, val)} />
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button id="prev-question" onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
                  disabled={currentIdx === 0} className="btn btn-secondary" style={{ opacity: currentIdx === 0 ? 0.4 : 1, padding: '0.75rem 1.5rem' }}>
                  ← Previous
                </button>
                <button id="next-question" onClick={() => setCurrentIdx(p => Math.min(questions.length - 1, p + 1))}
                  disabled={currentIdx === questions.length - 1} className="btn btn-secondary"
                  style={{ opacity: currentIdx === questions.length - 1 ? 0.4 : 1, padding: '0.75rem 1.5rem' }}>
                  Next →
                </button>
              </div>

              {submitError && (
                <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {submitError}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
