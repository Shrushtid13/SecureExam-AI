import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user: loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (loginUser) {
      navigate(loginUser.role === 'student' ? '/dashboard/student' : '/dashboard/teacher')
    }
  }, [loginUser, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'student' ? '/dashboard/student' : '/dashboard/teacher')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
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
          padding: 4rem;
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
          padding: 1rem 0;
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

        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          margin-top: 0.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
          cursor: pointer;
        }

        .remember-me input {
          margin-right: 0.5rem;
          accent-color: #0dcaf0;
          width: 14px;
          height: 14px;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 0.75rem;
          color: #087990;
          text-decoration: none;
          font-weight: 600;
        }
        
        .forgot-link:hover {
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
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(13, 202, 240, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #dee2e6;
        }

        .divider span {
          padding: 0 1rem;
          font-size: 0.65rem;
          color: #adb5bd;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .btn-secondary {
          width: 100%;
          background-color: white;
          color: #495057;
          border: 1px solid #ced4da;
          padding: 0.9rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: #0dcaf0;
          color: #087990;
        }

        .signup-text {
          text-align: center;
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 2.5rem;
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
                Access the premier AI-powered remote proctoring platform. Ensure academic integrity with advanced, automated evaluation and analytics.
              </p>
            </div>
          </div>

          <div className="right-panel">
            <div className="circle-3"></div>
            
            <div className="right-content">
              <h2 className="form-title">Sign in</h2>
              <p className="form-subtitle">Please log in securely to access your dashboard and exams.</p>
              
              {error && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '1.5rem', fontWeight: '500', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <input 
                    id="login-email"
                    type="email" 
                    placeholder="User Name" 
                    className="custom-input"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password" 
                    className="custom-input"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="show-btn">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="options-row">
                  <label className="remember-me">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <a href="#" className="forgot-link">Forgot Password?</a>
                </div>

                <button 
                  id="login-submit"
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              <button type="button" onClick={() => alert('Google Sign-In is not yet configured. This will be integrated with Firebase in a future phase.')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>

              <p className="signup-text">
                Don't have an account? <Link to="/register" className="signup-link">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
