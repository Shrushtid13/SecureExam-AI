import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

function ResultCard({ exam, user }) {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/analytics/exams/${exam.id}/student/${user.id}/result`)
      .then(res => setResult(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('No submission found for this exam.')
        } else {
          setError('Failed to load result.')
        }
      })
      .finally(() => setLoading(false))
  }, [exam.id, user.id])

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>{exam.title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>
            {new Date(exam.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 24, height: 24 }}></div>
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 8, border: '1px dashed var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{result.score}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Taken</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)' }}>
              {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>{result.answers ? Object.keys(result.answers).length : 0}</strong> questions answered
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
             <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }} onClick={() => navigate(`/exam/${exam.id}/result`)}>
               View Detailed Analysis
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentResults() {
  const { user, logout } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all exams the student is enrolled in
    api.get('/exams')
      .then(r => {
        // Filter exams that have already ended
        const ended = r.data.exams.filter(e => new Date(e.end_time) < new Date())
        setExams(ended)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>My Results</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>View your past exam scores</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem' }} className="fade-in">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="card-flat" style={{ padding: '4rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>🎓</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No Past Exams</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.6, fontSize: '0.9rem' }}>You haven't completed any exams yet. Your results will appear here once an exam concludes.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {exams.map(exam => <ResultCard key={exam.id} exam={exam} user={user} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
