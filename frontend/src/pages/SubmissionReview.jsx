import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

export default function SubmissionReview() {
  const { examId, studentId } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [result, setResult] = useState(null)
  const [integrityData, setIntegrityData] = useState(null)
  const [tab, setTab] = useState('results')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [manualScore, setManualScore] = useState('')
  const [savingScore, setSavingScore] = useState(false)
  const [questionGrades, setQuestionGrades] = useState({})
  const [savingQuestion, setSavingQuestion] = useState(null)
  
  const isTeacher = ['teacher', 'admin'].includes(user?.role)

  const loadData = async () => {
    try {
      // In the route, if studentId is not provided, we use user.id (for student view)
      const targetStudent = studentId || user.id
      const [res, int] = await Promise.all([
        api.get(`/analytics/exams/${examId}/student/${targetStudent}/result`),
        api.get(`/analytics/exams/${examId}/student/${targetStudent}/integrity`)
      ])
      setResult(res.data)
      setIntegrityData(int.data)
      setManualScore(res.data.score || 0)
      const initialGrades = {}
      res.data.breakdown.forEach(q => {
        if (q.type === 'subjective') {
          initialGrades[q.question_id] = q.points_earned || 0
        }
      })
      setQuestionGrades(initialGrades)
    } catch (err) {
      setError('Failed to load submission data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [examId, studentId])

  const handleGradeQuestion = async (questionId, points, totalPossible) => {
    const grade = Math.min(Math.max(0, parseInt(points, 10) || 0), totalPossible)
    setSavingQuestion(questionId)
    try {
      const newGrades = { ...questionGrades, [questionId]: grade }
      setQuestionGrades(newGrades)

      let newTotalScore = 0
      result.breakdown.forEach(q => {
        if (q.type === 'subjective') {
          newTotalScore += (newGrades[q.question_id] || 0)
        } else {
          newTotalScore += (q.points_earned || 0)
        }
      })

      const targetStudent = studentId || user.id
      await api.put(`/analytics/exams/${examId}/student/${targetStudent}/score`, {
        score: newTotalScore
      })
      setManualScore(newTotalScore)
      await loadData()
    } catch (err) {
      alert('Failed to save grade')
    } finally {
      setSavingQuestion(null)
    }
  }

  const handleUpdateScore = async () => {
    if (!isTeacher) return
    setSavingScore(true)
    try {
      const targetStudent = studentId || user.id
      await api.put(`/analytics/exams/${examId}/student/${targetStudent}/score`, {
        score: parseInt(manualScore, 10)
      })
      await loadData()
      alert('Score updated successfully')
    } catch (err) {
      alert('Failed to update score')
    } finally {
      setSavingScore(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                Submission Review
              </h2>
            </div>
            {result && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, marginLeft: '2rem' }}>
                Total possible points: {result.total_possible}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }} className="fade-in">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem 1.5rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 12, fontWeight: 600 }}>
              {error}
            </div>
          ) : !result ? (
            <div style={{ padding: '1rem 1.5rem', background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 12, fontWeight: 600 }}>
              No submission found.
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Score Header */}
              <div className="card-flat" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Exam Result
                  </h3>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Submitted: {new Date(result.submitted_at).toLocaleString()}</span>
                    <span>Time taken: {result.time_taken_seconds != null ? `${Math.floor(result.time_taken_seconds / 60)}m ${result.time_taken_seconds % 60}s` : 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                      {result.percentage}%
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {result.score} / {result.total_possible} PTS
                    </div>
                  </div>
                  
                  {isTeacher && (
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manual Grade Override</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" className="input-field" style={{ width: 80, padding: '0.5rem' }} 
                               value={manualScore} onChange={e => setManualScore(e.target.value)} />
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleUpdateScore} disabled={savingScore}>
                          {savingScore ? 'Saving' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                <button onClick={() => setTab('results')} className={`tab ${tab === 'results' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === 'results' ? 'var(--primary)' : 'transparent'}`, color: tab === 'results' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                  Performance & Answers
                </button>
                <button onClick={() => setTab('integrity')} className={`tab ${tab === 'integrity' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === 'integrity' ? 'var(--primary)' : 'transparent'}`, color: tab === 'integrity' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                  Proctoring & Integrity
                </button>
              </div>

              {tab === 'results' ? (
                <>
                  {/* Breakdown */}
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '1rem' }}>Detailed Answers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.breakdown.map((q, idx) => (
                  <div key={q.question_id} className="card-flat" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '0.2rem 0.6rem', borderRadius: 6, textTransform: 'uppercase' }}>
                        Q{idx + 1} • {q.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {q.points_possible} pt{q.points_possible !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-h)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      {q.question_text}
                    </p>

                    <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Student's Answer:</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-p)' }}>
                          {q.student_answer || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}
                        </span>
                      </div>
                      
                      {q.type !== 'subjective' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Correct Answer:</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>{q.correct_answer}</span>
                          </div>
                          
                          {q.is_correct ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              Correct (+{q.points_earned})
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Incorrect (0)
                            </span>
                          )}
                        </div>
                      )}
                      
                      {q.type === 'subjective' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points Earned:</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: (questionGrades[q.question_id] || 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {questionGrades[q.question_id] || 0} / {q.points_possible}
                          </span>
                        </div>
                      )}

                      {q.type === 'subjective' && isTeacher && (
                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grade:</span>
                            <input
                              type="number"
                              className="input-field"
                              style={{ width: 70, padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}
                              min={0}
                              max={q.points_possible}
                              value={questionGrades[q.question_id] ?? 0}
                              onChange={e => setQuestionGrades(prev => ({ ...prev, [q.question_id]: e.target.value }))}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {q.points_possible}</span>
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}
                            disabled={savingQuestion === q.question_id}
                            onClick={() => handleGradeQuestion(q.question_id, questionGrades[q.question_id], q.points_possible)}
                          >
                            {savingQuestion === q.question_id ? 'Saving…' : 'Save Grade'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </>
              ) : tab === 'integrity' && integrityData ? (
                <div className="fade-in space-y-6">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>Proctoring Flags ({integrityData.total_flags})</h3>
                  </div>
                  
                  {integrityData.total_flags === 0 ? (
                    <div className="card-flat" style={{ padding: '3rem', textAlign: 'center', background: 'var(--success-soft)', color: 'var(--success)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <p style={{ fontWeight: 600 }}>No integrity violations detected during this exam.</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '7px', width: 2, background: 'var(--border)' }}></div>
                      {integrityData.timeline.map((flag, i) => (
                        <div key={flag.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                          <div style={{ position: 'absolute', top: '0.25rem', left: '-1.5rem', width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', border: '4px solid var(--bg-main)' }}></div>
                          <div className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)' }}>{flag.flag_type.replace(/_/g, ' ').toUpperCase()}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{new Date(flag.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-h)', fontWeight: 500, marginBottom: flag.snapshot_key ? '1rem' : 0 }}>
                              {flag.detail}
                            </p>
                            {flag.snapshot_key && (
                              <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', display: 'inline-block' }}>
                                <img src={`http://localhost:9000/secureexam-snapshots/${flag.snapshot_key}`} alt="Evidence" style={{ height: 120, display: 'block', opacity: 0.9 }} onError={(e) => e.target.style.display = 'none'} />
                              </div>
                            )}
                            <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Source: {flag.source}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
