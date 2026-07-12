import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, user: regUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (regUser) {
      navigate(regUser.role === 'student' ? '/dashboard/student' : '/dashboard/teacher')
    }
  }, [regUser, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form.name, form.email, form.password, form.role)
      navigate(user.role === 'student' ? '/dashboard/student' : '/dashboard/teacher')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        .page-bg {
          background-color: #0dcaf0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Poppins', sans-serif;
        }

        .auth-card {
          background-color: #ffffff;
          border-radius: 24px;
          display: flex;
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
        }

        .left-panel {
          width: 50%;
          background: linear-gradient(135deg, #0dcaf0 0%, #087990 100%);
          border-radius: 24px 0 0 24px;
          padding: 4rem;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .circle-1 {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 500px;
          height: 500px;
          background-color: #0bacbe;
          border-radius: 50%;
          z-index: 1;
        }

        .circle-2 {
          position: absolute;
          bottom: -15%;
          right: -10%;
          width: 350px;
          height: 350px;
          background-color: #055160;
          border-radius: 50%;
          z-index: 1;
        }

        .left-content {
          position: relative;
          z-index: 2;
        }

        .welcome-title {
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .welcome-subtitle {
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          margin-bottom: 1.5rem;
          color: #cff4fc;
          text-transform: uppercase;
        }

        .welcome-text {
          font-size: 0.75rem;
          line-height: 1.8;
          font-weight: 400;
          color: #e0f8f9;
          max-width: 300px;
        }

        .right-panel {
          width: 50%;
          padding: 3rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-color: white;
          border-radius: 0 24px 24px 0;
          position: relative;
          overflow: hidden;
        }

        .circle-3 {
          position: absolute;
          bottom: -40px;
          right: -40px;
          width: 150px;
          height: 150px;
          background-color: #0dcaf0;
          border-radius: 50%;
          z-index: 0;
        }

        .right-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 340px;
          margin: 0 auto;
        }

        .form-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: #212529;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .input-group {
          background-color: #f8f9fa;
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 1.25rem;
          margin-bottom: 1rem;
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;
        }

        .input-group:focus-within {
          border-color: #0dcaf0;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(13, 202, 240, 0.15);
        }

        .input-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #adb5bd;
          margin-right: 0.75rem;
        }

        .custom-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0.85rem 0;
          font-size: 0.85rem;
          font-weight: 500;
          color: #212529;
          outline: none;
          font-family: inherit;
        }

        .custom-input::placeholder {
          color: #adb5bd;
          font-weight: 400;
        }

        .custom-select {
          appearance: none;
          cursor: pointer;
        }

        .show-btn {
          font-size: 0.65rem;
          font-weight: 700;
          color: #087990;
          text-transform: uppercase;
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 0.5px;
          padding: 0.5rem;
        }

        .show-btn:hover {
          color: #055160;
        }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #0dcaf0 0%, #087990 100%);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 1rem;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(13, 202, 240, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .signup-text {
          text-align: center;
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 2rem;
          font-weight: 500;
        }

        .signup-link {
          color: #087990;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel { width: 100%; border-radius: 24px; padding: 2.5rem 1.5rem; }
        }
      `}</style>

      <div className="page-bg fade-in">
        <div className="auth-card">
          <div className="left-panel">
            <div className="circle-1"></div>
            <div className="circle-2"></div>
            
            <div className="left-content">
              <h2 className="welcome-title">Welcome</h2>
              <h3 className="welcome-subtitle">AI Proctoring Portal</h3>
              <p className="welcome-text">
                Join the premier AI-powered remote proctoring platform. Ensure academic integrity with advanced, automated evaluation and analytics.
              </p>
            </div>
          </div>

          <div className="right-panel">
            <div className="circle-3"></div>
            
            <div className="right-content">
              <h2 className="form-title">Sign up</h2>
              <p className="form-subtitle">Create an account to get started.</p>
              
              {error && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '1.5rem', fontWeight: '500', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <input 
                    id="reg-name"
                    type="text" 
                    placeholder="Full Name" 
                    className="custom-input"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Email */}
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <input 
                    id="reg-email"
                    type="email" 
                    placeholder="Email Address" 
                    className="custom-input"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                {/* Password */}
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input 
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password (Min 6 chars)" 
                    className="custom-input"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="show-btn">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Role Select */}
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <select 
                    id="reg-role"
                    className="custom-input custom-select"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                <button 
                  id="reg-submit"
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </form>

              <p className="signup-text">
                Already have an account? <Link to="/login" className="signup-link">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
