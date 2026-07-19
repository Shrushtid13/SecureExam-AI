import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'subjective', label: 'Subjective' },
]

const TYPE_COLORS = {
  mcq: { bg: 'var(--primary-soft)', color: 'var(--primary-dark)', label: 'MCQ' },
  true_false: { bg: 'var(--accent-soft)', color: 'var(--accent)', label: 'True/False' },
  numeric: { bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'Numeric' },
  subjective: { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Subjective' },
}

const emptyForm = () => ({
  type: 'mcq',
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: '',
  points: 1,
})

/* ── Question Card ───────────────────────────────────────────── */
function QuestionCard({ question, index, onEdit, onDelete, isEnded }) {
  const tc = TYPE_COLORS[question.type] || TYPE_COLORS.mcq
  const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options

  return (
    <div className="card-flat" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      {/* Number badge */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: 'var(--primary-soft)', color: 'var(--primary-dark)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-heading)',
      }}>
        {index + 1}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem',
            borderRadius: 6, background: tc.bg, color: tc.color,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {tc.label}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {question.points} pt{question.points !== 1 ? 's' : ''}
          </span>
        </div>

        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-h)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          {question.question_text}
        </p>

        {/* MCQ options */}
        {question.type === 'mcq' && opts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {opts.map((opt, i) => (
              <div key={i} style={{
                padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500,
                background: String(question.correct_answer) === String(opt) ? 'var(--success-soft)' : 'var(--bg-main)',
                border: String(question.correct_answer) === String(opt) ? '1.5px solid var(--success)' : '1px solid var(--border)',
                color: String(question.correct_answer) === String(opt) ? 'var(--success)' : 'var(--text-p)',
              }}>
                <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>{String.fromCharCode(65 + i)}.</span>
                {opt}
                {String(question.correct_answer) === String(opt) && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>✓ Correct</span>}
              </div>
            ))}
          </div>
        )}

        {/* True/False answer */}
        {question.type === 'true_false' && question.correct_answer && (
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>
            Correct: {question.correct_answer}
          </div>
        )}

        {/* Numeric answer */}
        {question.type === 'numeric' && question.correct_answer && (
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>
            Correct: {question.correct_answer}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEnded && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={onEdit} style={{
            padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--primary-dark)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>Edit</button>
          <button onClick={onDelete} style={{
            padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            border: '1.5px solid rgba(239,68,68,.2)', background: 'var(--danger-soft)', color: 'var(--danger)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>Delete</button>
        </div>
      )}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ExamBuilder() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null) // question id being edited
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isEnded = exam ? new Date() > new Date(exam.end_time) : false

  async function loadExam() {
    try {
      const { data } = await api.get(`/exams/${examId}`)
      setExam(data.exam)
      setQuestions(data.questions || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadExam() }, [examId])

  function openEditForm(q) {
    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    setForm({
      type: q.type,
      question_text: q.question_text,
      options: q.type === 'mcq' ? (opts || ['', '', '', '']) : ['', '', '', ''],
      correct_answer: q.correct_answer || '',
      points: q.points,
    })
    setEditingId(q.id)
    setShowForm(true)
    setFormError('')
  }

  function openNewForm() {
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(true)
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(''); setSubmitting(true)

    const payload = {
      type: form.type,
      question_text: form.question_text,
      options: form.type === 'mcq' ? form.options.filter(o => o.trim()) : null,
      correct_answer: form.type === 'subjective' ? null : form.correct_answer,
      points: parseInt(form.points, 10),
    }

    if (form.type === 'mcq' && (!payload.options || payload.options.length < 2)) {
      setFormError('MCQ requires at least 2 options.')
      setSubmitting(false)
      return
    }

    if (form.type !== 'subjective' && !payload.correct_answer) {
      setFormError('Please specify the correct answer.')
      setSubmitting(false)
      return
    }

    try {
      if (editingId) {
        await api.put(`/exams/${examId}/questions/${editingId}`, payload)
      } else {
        await api.post(`/exams/${examId}/questions`, payload)
      }
      setShowForm(false)
      const msg = editingId ? '✓ Question updated successfully!' : '✓ Question added successfully!'
      setEditingId(null)
      setForm(emptyForm())
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 3000)
      loadExam()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save question')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(qId) {
    if (!confirm('Delete this question?')) return
    try {
      await api.delete(`/exams/${examId}/questions/${qId}`)
      loadExam()
    } catch (err) { alert('Failed to delete question') }
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '0.5rem',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <Link to="/dashboard/teacher" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                {exam ? exam.title : 'Exam Builder'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, marginLeft: '2rem' }}>
              {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalPoints} total points
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            {!isEnded && (
              <button className="btn btn-primary" onClick={() => showForm ? setShowForm(false) : openNewForm()}>
                {showForm
                  ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Question</>
                }
              </button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }} className="fade-in">

          {/* Ended banner */}
          {isEnded && (
            <div style={{
              padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: 14,
              background: 'var(--warning-soft)', border: '1.5px solid rgba(245,158,11,.2)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              This exam has ended. Questions are locked and cannot be modified.
            </div>
          )}

          {/* Add/Edit Question Form */}
          {showForm && (
            <div className="card-flat fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: editingId ? 'var(--accent-soft)' : 'var(--primary-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: editingId ? 'var(--accent)' : 'var(--primary-dark)',
                }}>
                  {editingId
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>
                    {editingId ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {editingId ? 'Update the question details below' : 'Choose a type and fill in the details'}
                  </p>
                </div>
              </div>

              {formError && (
                <div style={{ padding: '0.875rem 1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', border: '1.5px solid rgba(239,68,68,.15)' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Row: Type + Points */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Question Type</label>
                    <select className="input-field" value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value, correct_answer: '', options: e.target.value === 'mcq' ? ['', '', '', ''] : p.options }))}>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Points</label>
                    <input type="number" className="input-field" min={0}
                      value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))} required />
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label style={labelStyle}>Question Text</label>
                  <textarea className="input-field" rows={3} placeholder="Enter the question..."
                    style={{ resize: 'vertical', fontFamily: 'var(--font)', fontSize: '0.9rem', lineHeight: 1.6 }}
                    value={form.question_text} onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))} required />
                </div>

                {/* MCQ Options */}
                {form.type === 'mcq' && (
                  <div>
                    <label style={labelStyle}>Answer Options</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {form.options.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 700,
                            background: form.correct_answer === opt && opt ? 'var(--success-soft)' : 'var(--bg-main)',
                            color: form.correct_answer === opt && opt ? 'var(--success)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <input type="text" className="input-field" placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            style={{ flex: 1 }}
                            value={opt}
                            onChange={e => {
                              const newOpts = [...form.options]
                              newOpts[i] = e.target.value
                              setForm(p => ({ ...p, options: newOpts }))
                            }} />
                          {form.options.length > 2 && (
                            <button type="button" onClick={() => {
                              const newOpts = form.options.filter((_, j) => j !== i)
                              setForm(p => ({ ...p, options: newOpts }))
                            }} style={{
                              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem',
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {form.options.length < 6 && (
                        <button type="button" onClick={() => setForm(p => ({ ...p, options: [...p.options, ''] }))}
                          style={{
                            padding: '0.5rem', borderRadius: 8, border: '1.5px dashed var(--border)',
                            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                          }}>
                          + Add Option
                        </button>
                      )}
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label style={labelStyle}>Correct Answer</label>
                      <select className="input-field" value={form.correct_answer}
                        onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}>
                        <option value="">Select correct option...</option>
                        {form.options.filter(o => o.trim()).map((opt, i) => (
                          <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* True/False */}
                {form.type === 'true_false' && (
                  <div>
                    <label style={labelStyle}>Correct Answer</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['True', 'False'].map(v => (
                        <button type="button" key={v}
                          onClick={() => setForm(p => ({ ...p, correct_answer: v }))}
                          style={{
                            flex: 1, padding: '0.85rem', borderRadius: 12, cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
                            border: form.correct_answer === v ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                            background: form.correct_answer === v ? 'var(--primary-soft)' : 'var(--bg-card)',
                            color: form.correct_answer === v ? 'var(--primary-dark)' : 'var(--text-muted)',
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Numeric */}
                {form.type === 'numeric' && (
                  <div>
                    <label style={labelStyle}>Correct Answer (Number)</label>
                    <input type="text" className="input-field" placeholder="e.g. 42, 3.14"
                      value={form.correct_answer}
                      onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))} />
                  </div>
                )}

                {/* Subjective — no correct answer needed */}
                {form.type === 'subjective' && (
                  <div style={{
                    padding: '1rem 1.25rem', borderRadius: 12,
                    background: 'var(--success-soft)', border: '1px solid var(--success)',
                    fontSize: '0.85rem', fontWeight: 500, color: 'var(--success)',
                  }}>
                    Subjective questions will be stored for manual review. No automatic grading.
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }} disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Update Question' : 'Add Question'}
                </button>
              </form>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: 14, background: 'var(--success-soft)', border: '1.5px solid var(--success)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', animation: 'fadeIn 0.3s ease' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {successMsg}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: 14, background: 'var(--success-soft)', border: '1.5px solid var(--success)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {successMsg}
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="card-flat" style={{ padding: '4rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>📝</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No Questions Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.6, fontSize: '0.9rem' }}>
                Click "Add Question" to start building your exam.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id} question={q} index={i}
                    isEnded={isEnded}
                    onEdit={() => openEditForm(q)}
                    onDelete={() => handleDelete(q.id)}
                  />
                ))}
              </div>

              {/* Finish & Return */}
              {!isEnded && (
                <div style={{ marginTop: '2rem', padding: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalPoints} total points · All changes saved automatically
                  </div>
                  <button onClick={() => navigate('/dashboard/teacher')} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Finish & Return to Dashboard
                  </button>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  )
}
