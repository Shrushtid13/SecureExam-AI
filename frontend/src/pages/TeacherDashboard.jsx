import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api'
import { io as socketIO } from 'socket.io-client'

import ThemeToggle from '../components/ThemeToggle'
import Sidebar from '../components/Sidebar'
/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, icon, bg, color, sub }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-h)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ── Exam Row ─────────────────────────────────────────────────── */
function ExamRow({ exam, onDelete, onEnroll, onProctoring, onQuestions }) {
  const now = new Date()
  const isLive = now >= new Date(exam.start_time) && now <= new Date(exam.end_time)
  const isUpcoming = now < new Date(exam.start_time)

  const actionBtn = {
    fontSize: '0.78rem', fontWeight: 700, padding: '0.45rem 0.9rem',
    borderRadius: 9, border: '1.5px solid var(--border)',
    color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', transition: 'all .2s',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid var(--border)',
      transition: 'background .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Status dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: isLive ? 'var(--success)' : isUpcoming ? 'var(--primary)' : 'var(--border)',
        boxShadow: isLive ? '0 0 0 3px var(--success-soft)' : 'none',
      }}></div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-h)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {exam.duration_minutes} min · {new Date(exam.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Badge */}
      <span className={`badge ${isLive ? 'badge-live' : isUpcoming ? 'badge-upcoming' : 'badge-ended'}`}>
        {isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Ended'}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button onClick={() => onQuestions(exam)} style={{...actionBtn, borderColor: 'rgba(34,197,94,.3)', color: 'var(--success)'}}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--success-soft)'; e.currentTarget.style.color = 'var(--success)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--success)' }}
          title="Add or edit questions"
        >
          Questions
        </button>
        <button style={{...actionBtn, borderColor: 'rgba(245,158,11,.3)', color: 'var(--warning)'}} title="View proctoring report"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--warning-soft)'; e.currentTarget.style.color = 'var(--warning)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--warning)' }}
          onClick={() => onProctoring(exam)}
        >
          Proctoring
        </button>
        <button onClick={() => onEnroll(exam)} style={{...actionBtn, borderColor: 'rgba(13,202,240,.3)', color: 'var(--primary-dark)'}}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-soft)'; e.currentTarget.style.color = 'var(--primary-dark)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-dark)' }}
        >
          Enroll
        </button>
        <button onClick={() => onDelete(exam.id)} style={{
          fontSize: '0.78rem', fontWeight: 700, padding: '0.45rem 0.9rem',
          borderRadius: 9, border: '1.5px solid rgba(239,68,68,.2)',
          color: 'var(--danger)', background: 'var(--danger-soft)', cursor: 'pointer', transition: 'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────── */
export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', durationMinutes: 60, startTime: '', endTime: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Enrollment modal state
  const [enrollExam, setEnrollExam] = useState(null) // the exam to enroll students into
  const [emailsText, setEmailsText] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollResult, setEnrollResult] = useState(null)
  
  // Classes state
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')

  // Proctoring report modal state
  const [proctoringExam, setProctoringExam] = useState(null)
  const [proctoringFlags, setProctoringFlags] = useState([])
  const [proctoringLoading, setProctoringLoading] = useState(false)
  const [snapshotPreview, setSnapshotPreview] = useState(null)
  const socketRef = useRef(null)

  // Socket.io live monitoring — connect when proctoring modal is open
  useEffect(() => {
    if (!proctoringExam) {
      // Disconnect when modal closes
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const socket = socketIO('http://localhost:5000')
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_exam_monitor', proctoringExam.id)
      console.log('Joined monitoring room for exam', proctoringExam.id)
    })

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason)
    })

    // Socket.io auto-reconnects, 'connect' will fire again to re-join the room.
    socket.io.on('reconnect', (attempt) => {
      console.log('Socket reconnected after', attempt, 'attempts')
    })

    socket.on('new_proctoring_flag', (flag) => {
      setProctoringFlags(prev => [flag, ...prev])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [proctoringExam])

  const load = () => {
    api.get('/exams').then(r => setExams(r.data.exams)).catch(console.error).finally(() => setLoading(false))
    api.get('/classes/my').then(r => setClasses(r.data.classes)).catch(console.error)
  }
  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true)
    try {
      const payload = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString()
      }
      await api.post('/exams', payload)
      setShowForm(false)
      setForm({ title: '', description: '', durationMinutes: 60, startTime: '', endTime: '' })
      load()
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to create exam') }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exam? This cannot be undone.')) return
    await api.delete(`/exams/${id}`); load()
  }

  const now = new Date()
  const live = exams.filter(e => now >= new Date(e.start_time) && now <= new Date(e.end_time)).length
  const upcoming = exams.filter(e => now < new Date(e.start_time)).length
  const ended = exams.filter(e => now > new Date(e.end_time)).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>Exam Management</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Create, monitor, and manage your exams</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            <button id="create-exam-btn" className="btn btn-primary"
              onClick={() => setShowForm(p => !p)}>
              {showForm
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Exam</>
              }
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem' }} className="fade-in">

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <StatCard label="Total Exams" value={exams.length} sub="All time"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              bg="var(--primary-soft)" color="var(--primary-dark)" />
            <StatCard label="Live Now" value={live} sub="Active exams"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              bg="var(--success-soft)" color="var(--success)" />
            <StatCard label="Upcoming" value={upcoming} sub="Scheduled"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              bg="var(--accent-soft)" color="var(--accent)" />
            <StatCard label="Ended" value={ended} sub="Completed"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              bg="var(--warning-soft)" color="var(--warning)" />
          </div>

          {/* Create Exam Form */}
          {showForm && (
            <div className="card-flat fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Create New Exam</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Fill in the details below to schedule an exam</p>
                </div>
              </div>

              {formError && (
                <div style={{ padding: '0.875rem 1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', border: '1.5px solid rgba(239,68,68,.15)' }}>
                  {formError}
                </div>
              )}

              <form id="create-exam-form" onSubmit={handleCreate}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Exam Title</label>
                  <input id="exam-title" type="text" className="input-field" placeholder="e.g. Midterm Mathematics"
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Description</label>
                  <input id="exam-desc" type="text" className="input-field" placeholder="Brief description of the exam"
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Duration (minutes)</label>
                  <input id="exam-duration" type="number" className="input-field" min={1}
                    value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Start Time</label>
                  <input id="exam-start" type="datetime-local" className="input-field"
                    value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>End Time</label>
                  <input id="exam-end" type="datetime-local" className="input-field"
                    value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button id="exam-submit" type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem 1.5rem' }} disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Exam List Table */}
          <div className="card-flat" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>All Exams</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>{exams.length} total examination{exams.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Table header */}
            {exams.length > 0 && (
              <div style={{ display: 'flex', padding: '0.65rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <div style={{ width: 22 }}></div>
                <div style={{ flex: 1, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '1rem' }}>Title</div>
                <div style={{ width: 110, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Status</div>
                <div style={{ width: 180, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Actions</div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <div className="spinner"></div>
              </div>
            ) : exams.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>📝</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No Exams Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.875rem' }}>Click "New Exam" to schedule your first examination.</p>
              </div>
            ) : (
              exams.map(exam => <ExamRow key={exam.id} exam={exam} onDelete={handleDelete} onEnroll={setEnrollExam} onQuestions={(ex) => navigate(`/dashboard/teacher/exams/${ex.id}/build`)} onProctoring={async (ex) => {
                setProctoringExam(ex); setProctoringLoading(true); setProctoringFlags([])
                try {
                  const { data } = await api.get(`/exams/${ex.id}/proctoring`)
                  setProctoringFlags(data.flags || [])
                } catch (err) { console.error(err) }
                finally { setProctoringLoading(false) }
              }} />)
            )}
          </div>

        </main>
      </div>

      {/* ── Enrollment Modal ─────────────────────────────────── */}
      {enrollExam && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
        }} onClick={() => { setEnrollExam(null); setEnrollResult(null); setEmailsText('') }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 560,
            boxShadow: '0 25px 60px rgba(0,0,0,.25)', maxHeight: '85vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '1.75rem 2rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Enroll Students</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>{enrollExam.title}</p>
              </div>
              <button onClick={() => { setEnrollExam(null); setEnrollResult(null); setEmailsText('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem 2rem' }}>

              {/* Enroll All button */}
              <button
                disabled={enrolling}
                onClick={async () => {
                  if (!confirm('Enroll ALL registered students into this exam?')) return;
                  setEnrolling(true); setEnrollResult(null);
                  try {
                    const { data } = await api.post(`/exams/${enrollExam.id}/enroll-bulk`, { enrollAll: true });
                    setEnrollResult(data.results);
                  } catch (err) { alert(err.response?.data?.error || 'Failed') }
                  finally { setEnrolling(false) }
                }}
                className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                {enrolling ? 'Enrolling…' : 'Enroll All Registered Students'}
              </button>

              {/* Enroll by Class */}
              {classes.length > 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-main)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Enroll by Class</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select className="input-field" style={{ flex: 1, padding: '0.6rem 1rem' }}
                      value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                      <option value="">Select a class…</option>
                      {classes.map(c => (
                        <option key={c.teacher_class_id} value={c.id}>Class {c.grade} {c.section} — {c.subject}</option>
                      ))}
                    </select>
                    <button disabled={!selectedClassId || enrolling}
                      onClick={async () => {
                        setEnrolling(true); setEnrollResult(null);
                        try {
                          const { data } = await api.post(`/exams/${enrollExam.id}/enroll-bulk`, { classId: parseInt(selectedClassId) });
                          setEnrollResult(data.results);
                        } catch (err) { alert(err.response?.data?.error || 'Failed') }
                        finally { setEnrolling(false) }
                      }}
                      className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                      {enrolling ? 'Enrolling…' : 'Enroll Class'}
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or paste emails</span>
                <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }}></div>
              </div>

              {/* Textarea for emails */}
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Student Emails (one per line, or comma-separated)
              </label>
              <textarea
                className="input-field"
                style={{ width: '100%', minHeight: 120, resize: 'vertical', fontFamily: 'var(--font)', fontSize: '0.85rem', lineHeight: 1.6 }}
                placeholder={'student1@example.com\nstudent2@example.com\nstudent3@example.com'}
                value={emailsText}
                onChange={e => setEmailsText(e.target.value)}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 500 }}>
                Paste up to 500 emails. Supports comma, semicolon, or newline separation.
              </p>

              <button
                disabled={enrolling || !emailsText.trim()}
                onClick={async () => {
                  setEnrolling(true); setEnrollResult(null);
                  const emails = emailsText.split(/[,;\n]+/).map(e => e.trim()).filter(Boolean);
                  try {
                    const { data } = await api.post(`/exams/${enrollExam.id}/enroll-bulk`, { emails });
                    setEnrollResult(data.results);
                  } catch (err) { alert(err.response?.data?.error || 'Failed') }
                  finally { setEnrolling(false) }
                }}
                className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              >
                {enrolling ? 'Enrolling…' : `Enroll ${emailsText.trim() ? emailsText.split(/[,;\n]+/).filter(e => e.trim()).length : 0} Student(s)`}
              </button>

              {/* Results */}
              {enrollResult && (
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-main)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>Enrollment Results</h4>
                  {enrollResult.enrolled.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>✓ Enrolled ({enrollResult.enrolled.length}):</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, wordBreak: 'break-all' }}>{enrollResult.enrolled.join(', ')}</p>
                    </div>
                  )}
                  {enrollResult.skipped.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>⊘ Already enrolled ({enrollResult.skipped.length}):</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, wordBreak: 'break-all' }}>{enrollResult.skipped.join(', ')}</p>
                    </div>
                  )}
                  {enrollResult.notFound.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>✗ Not found ({enrollResult.notFound.length}):</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, wordBreak: 'break-all' }}>{enrollResult.notFound.join(', ')}</p>
                    </div>
                  )}
                  {enrollResult.notStudent.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>✗ Not a student ({enrollResult.notStudent.length}):</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, wordBreak: 'break-all' }}>{enrollResult.notStudent.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Proctoring Report Modal ────────────────── */}
      {proctoringExam && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
        }} onClick={() => { setProctoringExam(null); setSnapshotPreview(null) }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 720,
            boxShadow: '0 25px 60px rgba(0,0,0,.25)', maxHeight: '85vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '1.75rem 2rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Proctoring Report</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>{proctoringExam.title}</p>
              </div>
              <button onClick={() => { setProctoringExam(null); setSnapshotPreview(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem 2rem' }}>
              {proctoringLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <div className="spinner"></div>
                </div>
              ) : proctoringFlags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--success)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>All Clear</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>No proctoring violations have been recorded for this exam.</p>
                </div>
              ) : (
                <>
                  {/* Summary badges */}
                  {(() => {
                    const students = [...new Set(proctoringFlags.map(f => f.student_id))]
                    const typeCounts = {}
                    proctoringFlags.forEach(f => { typeCounts[f.flag_type] = (typeCounts[f.flag_type] || 0) + 1 })
                    return (
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderRadius: 12, background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.15)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', marginBottom: '0.3rem' }}>Total Flags</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--danger)' }}>{proctoringFlags.length}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1.25rem', borderRadius: 12, background: 'var(--warning-soft)', border: '1px solid rgba(245,158,11,.15)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', marginBottom: '0.3rem' }}>Students Flagged</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--warning)' }}>{students.length}</div>
                        </div>
                        {Object.entries(typeCounts).map(([type, count]) => (
                          <div key={type} style={{ padding: '0.75rem 1.25rem', borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{type.replace(/_/g, ' ')}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-h)' }}>{count}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Flags table */}
                  <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 80px', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Student</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Type</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Detail</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: 'center' }}>Evidence</span>
                    </div>
                    {proctoringFlags.map(flag => (
                      <div key={flag.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 80px', gap: '0.5rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>{flag.student_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(flag.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 8, background: flag.flag_type === 'fullscreen_exit' ? 'var(--danger-soft)' : flag.flag_type === 'tab_switched' ? 'var(--warning-soft)' : 'var(--accent-soft)', color: flag.flag_type === 'fullscreen_exit' ? 'var(--danger)' : flag.flag_type === 'tab_switched' ? 'var(--warning)' : 'var(--accent)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {flag.flag_type.replace(/_/g, ' ')}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={flag.detail}>
                          {flag.detail || '—'}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {flag.snapshot_key ? (
                            <button onClick={() => setSnapshotPreview(flag.snapshot_key)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary-dark)', cursor: 'pointer' }}>View</button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Snapshot Preview Modal ─────────────────── */}
      {snapshotPreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', cursor: 'pointer',
        }} onClick={() => setSnapshotPreview(null)}>
          <div style={{ maxWidth: 640, maxHeight: '80vh', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.4)' }} onClick={e => e.stopPropagation()}>
            <img src={snapshotPreview} alt="Violation snapshot" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Webcam Snapshot at time of violation</span>
              <button onClick={() => setSnapshotPreview(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
