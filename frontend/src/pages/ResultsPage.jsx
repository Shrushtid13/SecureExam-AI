import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

export default function ResultsPage() {
  const { user, logout } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExams() {
      try {
        const { data } = await api.get('/exams')
        setExams(data.exams || [])
      } catch (err) {
        console.error('Failed to load exams', err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  // Show exams that have started or ended, ordered by start time
  const pastExams = exams
    .filter(e => new Date(e.start_time) <= new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />
      
      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>Exam Results & Analytics</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Select an exam to view detailed reports.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }} className="fade-in">
          {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
          </div>
        ) : pastExams.length === 0 ? (
          <div className="card-flat" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>No past or live exams available for analysis yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {pastExams.map(exam => {
              const now = new Date()
              const end = new Date(exam.end_time)
              const isEnded = now > end

              return (
                <div key={exam.id} className="card hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}>{exam.title}</h3>
                    <span className={`badge ${isEnded ? 'badge-secondary' : 'badge-success'}`}>
                      {isEnded ? 'Ended' : 'Live'}
                    </span>
                  </div>
                  
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {new Date(exam.start_time).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {exam.duration_minutes} minutes
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <Link to={`/dashboard/teacher/results/${exam.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', padding: '0.6rem', fontSize: '0.9rem' }}>
                      View Analytics →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
