import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

export default function StudentsPage() {
  const { user, logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [classForm, setClassForm] = useState({ grade: '', section: 'A', subject: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Selected class state
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [newStudentEmail, setNewStudentEmail] = useState('')

  const loadClasses = () => api.get('/classes/my').then(r => setClasses(r.data.classes)).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { loadClasses() }, [])

  async function handleCreateClass(e) {
    e.preventDefault()
    setFormError(''); setSubmitting(true)
    try {
      await api.post('/classes', classForm)
      setShowCreateClass(false)
      setClassForm({ grade: '', section: 'A', subject: '' })
      loadClasses()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create/assign class')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadClassDetails(cls) {
    setSelectedClass(cls)
    try {
      const { data } = await api.get(`/classes/${cls.id}`)
      setStudents(data.students)
    } catch (err) { console.error(err) }
  }

  async function handleAddStudent(e) {
    e.preventDefault()
    if (!newStudentEmail) return
    try {
      await api.post(`/classes/${selectedClass.id}/students`, { email: newStudentEmail })
      setNewStudentEmail('')
      loadClassDetails(selectedClass) // reload students
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add student')
    }
  }

  async function handleRemoveStudent(studentId) {
    if (!confirm('Remove student from this class?')) return
    try {
      await api.delete(`/classes/${selectedClass.id}/students/${studentId}`)
      loadClassDetails(selectedClass) // reload
    } catch (err) {
      alert('Failed to remove student')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={user} logout={logout} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>My Classes & Students</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Manage the classes and subjects you teach</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            <button className="btn btn-primary" onClick={() => setShowCreateClass(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Assign New Class
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.5rem' }} className="fade-in">
          
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>
          ) : classes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-h)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>No Classes Assigned</h3>
              <p style={{ color: 'var(--text-muted)' }}>Click "Assign New Class" to set up your subjects and sections.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {classes.map(c => (
                <div key={c.teacher_class_id} className="card-flat" style={{ padding: '1.5rem', cursor: 'pointer', border: selectedClass?.id === c.id ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => loadClassDetails(c)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Class {c.grade} {c.section}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>{c.subject}</p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Class Details & Students List */}
          {selectedClass && (
            <div className="card-flat fade-in" style={{ marginTop: '2.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', fontFamily: 'var(--font-heading)' }}>Students in Class {selectedClass.grade} {selectedClass.section}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Subject: {selectedClass.subject} · {students.length} students</p>
                </div>
                <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="email" placeholder="Student email..." className="input-field" style={{ padding: '0.5rem 1rem', width: 220 }} value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} required />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Add</button>
                </form>
              </div>

              {students.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students in this class yet. Add one above.</div>
              ) : (
                <div style={{ padding: '0' }}>
                  {students.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                      <button onClick={() => handleRemoveStudent(s.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-soft)', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setShowCreateClass(false)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 25px 60px rgba(0,0,0,.25)', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>Assign New Class</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create a new class or assign yourself to an existing one.</p>
            
            {formError && <div style={{ padding: '0.75rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>{formError}</div>}
            
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Grade / Year</label>
                <input type="text" className="input-field" placeholder="e.g. 3, 10, KG" value={classForm.grade} onChange={e => setClassForm(p => ({...p, grade: e.target.value}))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Division / Section</label>
                <input type="text" className="input-field" placeholder="e.g. A, B, North" value={classForm.section} onChange={e => setClassForm(p => ({...p, section: e.target.value}))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Subject You Teach</label>
                <input type="text" className="input-field" placeholder="e.g. Mathematics, Science" value={classForm.subject} onChange={e => setClassForm(p => ({...p, subject: e.target.value}))} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-main)', color: 'var(--text-h)' }} onClick={() => setShowCreateClass(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Saving...' : 'Assign Class'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
