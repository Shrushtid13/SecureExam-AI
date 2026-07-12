import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api'

import ThemeToggle from '../components/ThemeToggle'
import Sidebar from '../components/Sidebar'

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, icon, bg, color, sub }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-h)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ── Exam Card ────────────────────────────────────────────────── */
function ExamCard({ exam }) {
  const navigate = useNavigate()
  const now = new Date()
  const start = new Date(exam.start_time)
  const end = new Date(exam.end_time)
  const isLive = now >= start && now <= end
  const isUpcoming = now < start

  return (
    <div className="card" style={{ padding: '1.5rem', cursor: isLive ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      onClick={() => isLive && navigate(`/exam/${exam.id}`)}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className={`badge ${isLive ? 'badge-live' : isUpcoming ? 'badge-upcoming' : 'badge-ended'}`}>
          {isLive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>}
          {isLive ? 'Live Now' : isUpcoming ? 'Upcoming' : 'Ended'}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: isLive ? 'var(--success-soft)' : 'var(--bg-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isLive ? 'var(--success)' : 'var(--text-muted)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.35rem', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>{exam.title}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.5 }}>{exam.description || 'No description provided.'}</p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {exam.duration_minutes} min
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        {isLive && (
          <button className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
            onClick={e => { e.stopPropagation(); navigate(`/exam/${exam.id}`) }}>
            Enter →
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────── */
export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/exams').then(r => setExams(r.data.exams)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const liveExams = exams.filter(e => now >= new Date(e.start_time) && now <= new Date(e.end_time))
  const upcomingExams = exams.filter(e => now < new Date(e.start_time))
  const endedExams = exams.filter(e => now > new Date(e.end_time))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      {/* Main content offset by sidebar width */}
      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>Student Dashboard</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Welcome back, {user?.name} 👋</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user?.classGrade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary-soft)', borderRadius: 12, border: '1px solid var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2.2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Class {user.classGrade} {user.classSection}</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Page body */}
        <main style={{ flex: 1, padding: '2rem 2.5rem' }} className="fade-in">

          {/* Profile Card */}
          <div className="card-flat" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user?.email}</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {user?.classGrade ? (
                <div style={{ textAlign: 'center', padding: '0.75rem 1.5rem', background: 'var(--bg-main)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Class</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{user.classGrade} {user.classSection}</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '0.75rem 1.5rem', background: 'var(--warning-soft)', borderRadius: 14, border: '1px solid var(--warning)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>No class assigned</div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <StatCard label="Total Exams" value={exams.length} sub="All assigned exams"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              bg="var(--primary-soft)" color="var(--primary-dark)" />
            <StatCard label="Live Now" value={liveExams.length} sub="Currently active"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              bg="var(--success-soft)" color="var(--success)" />
            <StatCard label="Upcoming" value={upcomingExams.length} sub="Scheduled"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              bg="var(--accent-soft)" color="var(--accent)" />
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>My Exams</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem' }}>{exams.length} examination{exams.length !== 1 ? 's' : ''} assigned</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div className="spinner"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="card-flat" style={{ padding: '4rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>📋</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No Exams Assigned</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.6, fontSize: '0.9rem' }}>You are not enrolled in any exams yet. Your teacher will assign them when they are ready.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {exams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
