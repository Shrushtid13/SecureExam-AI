import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

// ─── Reusable Stat Card ───────────────────────────────────────────────────────
function StatCard({ title, value, subtext, icon, trend }) {
  return (
    <div className="card-flat hover-lift" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
        {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>{subtext}</div>}
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
  )
}

// ─── Custom CSS Score Distribution Chart ──────────────────────────────────────
function ScoreDistributionChart({ distribution, maxScore }) {
  // Find highest bucket to scale bars
  const maxCount = Math.max(...distribution, 1) // prevent div by zero

  const labels = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%']

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, padding: '1rem 0', gap: '4px' }}>
      {distribution.map((count, i) => {
        const heightPct = (count / maxCount) * 100
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', group: 'true' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', opacity: count > 0 ? 1 : 0, transition: 'all 0.2s' }}>
              {count}
            </span>
            <div style={{ 
              width: '100%', 
              height: `${heightPct}%`, 
              background: 'var(--primary)', 
              borderRadius: '6px 6px 0 0',
              minHeight: count > 0 ? 4 : 0,
              transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: '4px', whiteSpace: 'nowrap' }}>
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Student Detailed Analytics Modal ─────────────────────────────────────────
function StudentAnalyticsModal({ examId, studentId, studentName, onClose }) {
  const [tab, setTab] = useState('results') // 'results' or 'integrity'
  const [loading, setLoading] = useState(true)
  const [resultData, setResultData] = useState(null)
  const [integrityData, setIntegrityData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [res, int] = await Promise.all([
          api.get(`/analytics/exams/${examId}/student/${studentId}/result`),
          api.get(`/analytics/exams/${examId}/student/${studentId}/integrity`)
        ])
        setResultData(res.data)
        setIntegrityData(int.data)
      } catch (err) {
        console.error('Failed to load student analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [examId, studentId])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '2rem' }}>
      <div className="card-flat fade-in" style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>{studentName}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Detailed Analysis Report</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
          <button onClick={() => setTab('results')} className={`tab ${tab === 'results' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === 'results' ? 'var(--primary)' : 'transparent'}`, color: tab === 'results' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Performance & Answers
          </button>
          <button onClick={() => setTab('integrity')} className={`tab ${tab === 'integrity' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === 'integrity' ? 'var(--primary)' : 'transparent'}`, color: tab === 'integrity' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Proctoring & Integrity
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, background: 'var(--bg-main)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
          ) : tab === 'results' && resultData ? (
            <div className="fade-in space-y-6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)' }}>{resultData.score} / {resultData.total_possible}</div>
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Percentage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{resultData.percentage}%</div>
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Taken</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)' }}>{resultData.time_taken_seconds ? `${Math.floor(resultData.time_taken_seconds / 60)}m ${resultData.time_taken_seconds % 60}s` : 'N/A'}</div>
                </div>
              </div>

              {resultData.ai_summary && typeof resultData.ai_summary === 'object' ? (
                <div style={{ padding: '1.5rem', background: resultData.ai_summary.overall_risk === 'high' ? 'var(--danger-soft)' : 'var(--info-soft)', borderRadius: 12, border: `1px solid ${resultData.ai_summary.overall_risk === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`, marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: resultData.ai_summary.overall_risk === 'high' ? 'var(--danger)' : 'var(--info)', textTransform: 'uppercase' }}>AI Proctoring Report</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 999, background: 'var(--bg-main)', color: resultData.ai_summary.overall_risk === 'high' ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase' }}>Risk: {resultData.ai_summary.overall_risk}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 600, lineHeight: 1.6, marginBottom: '1rem' }}>{resultData.ai_summary.explanation}</p>
                  
                  {resultData.ai_summary.incidents && resultData.ai_summary.incidents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Incidents ({resultData.ai_summary.incidents.length})</h5>
                      {resultData.ai_summary.incidents.map((inc, i) => (
                        <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 500 }}>
                           <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '0.5rem' }}>Incident {i+1}:</span>
                           {inc.description || inc.details || JSON.stringify(inc)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : resultData.ai_summary && (
                <div style={{ padding: '1.5rem', background: 'var(--info-soft)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', marginBottom: '2rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>AI Proctoring Summary</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500, lineHeight: 1.6 }}>{resultData.ai_summary}</p>
                </div>
              )}

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '1rem' }}>Question Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {resultData.breakdown.map((q, i) => (
                  <div key={q.question_id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${q.type === 'subjective' ? 'var(--info)' : q.is_correct ? 'var(--success)' : 'var(--danger)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Question {i + 1} ({q.type.replace('_', ' ')})</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: q.is_correct ? 'var(--success)' : 'var(--text-h)' }}>{q.points_earned} / {q.points_possible} pts</span>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-h)', marginBottom: '1rem' }}>{q.question_text}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Student Answer:</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-h)', fontWeight: 500 }}>{q.student_answer || <i>Not answered</i>}</span>
                      </div>
                      {q.type !== 'subjective' && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Correct Answer:</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>{q.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', gap: '1rem' }}>
                          <span>Source: {flag.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Main Exam Analytics Page ──────────────────────────────────────────────────
export default function ExamAnalytics() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [severities, setSeverities] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null) // { id, name }

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [res, sev] = await Promise.all([
          api.get(`/analytics/exams/${examId}`),
          api.get(`/exams/${examId}/proctoring/severities`)
        ])
        setData(res.data)
        setSeverities(sev.data.severities || [])
      } catch (err) {
        console.error('Failed to load exam analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [examId])

  const handleGenerateSummary = async () => {
    setGenerating(true)
    try {
      await api.post(`/exams/${examId}/proctoring/generate-summary`)
      alert('AI summaries generated successfully! Refreshing data...')
      window.location.reload()
    } catch (err) {
      alert('Failed to generate summary.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />
      
      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <Link to="/dashboard/teacher/results" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>Analytics Report</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, marginLeft: '2rem' }}>Exam ID: {examId}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={handleGenerateSummary} 
              disabled={generating}
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
              {generating ? 'Generating...' : 'Generate AI Summary'}
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }} className="fade-in">

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
        ) : !data ? (
          <div className="card-flat" style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>Failed to load analytics data.</div>
        ) : (
          <div className="fade-in space-y-6">
            
            {data.exam_integrity_summary && (
              <div style={{ padding: '1.5rem', background: 'var(--info-soft)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', marginBottom: '2rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  AI Integrity Overview
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500, lineHeight: 1.6 }}>{data.exam_integrity_summary}</p>
                
                {severities.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {severities.map(s => (
                      <div key={s.student_id} style={{ 
                        padding: '0.4rem 0.75rem', 
                        borderRadius: 6, 
                        background: s.total_severity >= 20 ? 'var(--danger-soft)' : s.total_severity > 0 ? 'var(--warning-soft)' : 'var(--bg-main)',
                        color: s.total_severity >= 20 ? 'var(--danger)' : s.total_severity > 0 ? 'var(--warning)' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        {s.student_name} (Risk Score: {s.total_severity})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <StatCard 
                title="Average Score" 
                value={`${data.score_stats.average_percentage}%`}
                subtext={`(${data.score_stats.average} / ${data.total_possible} pts)`}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              />
              <StatCard 
                title="Submissions" 
                value={`${data.total_submitted} / ${data.total_enrolled}`}
                subtext="Students completed"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              />
              <StatCard 
                title="Avg Time / Question" 
                value={`${data.avg_time_per_question_seconds}s`}
                subtext={`Total avg: ${Math.floor(data.avg_time_seconds / 60)}m ${data.avg_time_seconds % 60}s`}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              />
              <StatCard 
                title="Proctoring Flags" 
                value={data.flag_summary.reduce((acc, curr) => acc + parseInt(curr.count), 0)}
                subtext="Total violations recorded"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Score Distribution Chart */}
              <div className="card-flat" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Score Distribution</h3>
                <ScoreDistributionChart distribution={data.score_distribution} maxScore={data.total_possible} />
              </div>

              {/* Flags Summary */}
              <div className="card-flat" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Integrity Summary</h3>
                {data.flag_summary.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No flags recorded.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.flag_summary.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 4, background: 'var(--danger-soft)', color: 'var(--danger)', textTransform: 'uppercase' }}>{f.source}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h)' }}>{f.flag_type.replace(/_/g, ' ')}</span>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-h)' }}>{f.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="card-flat" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Student Submissions</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                      <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                      <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Taken</th>
                      <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted At</th>
                      <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.submissions.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No submissions yet.</td></tr>
                    ) : (
                      data.submissions.map(sub => {
                        const timeSecs = Math.round((new Date(sub.submitted_at) - new Date(sub.started_at)) / 1000)
                        return (
                          <tr key={sub.student_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg">
                            <td style={{ padding: '1rem 2rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>{sub.student_name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.student_email}</div>
                            </td>
                            <td style={{ padding: '1rem 2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{sub.percentage}%</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({sub.score}/{data.total_possible})</div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 2rem', fontSize: '0.9rem', color: 'var(--text-h)', fontWeight: 500 }}>
                              {Math.floor(timeSecs / 60)}m {timeSecs % 60}s
                            </td>
                            <td style={{ padding: '1rem 2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                              {new Date(sub.submitted_at).toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem 2rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setSelectedStudent({ id: sub.student_id, name: sub.student_name })} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                  Integrity
                                </button>
                                <button onClick={() => navigate(`/dashboard/teacher/results/${examId}/student/${sub.student_id}`)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                  View Paper
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {selectedStudent && (
        <StudentAnalyticsModal 
          examId={examId} 
          studentId={selectedStudent.id} 
          studentName={selectedStudent.name} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  )
}
