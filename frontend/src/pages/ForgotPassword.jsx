import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    setPreviewUrl(null)
    setLoading(true)

    try {
      const res = await api.post('/auth/forgot-password', { email })
      setStatus({ type: 'success', message: res.data.message })
      if (res.data.previewUrl) {
        setPreviewUrl(res.data.previewUrl)
      }
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to request password reset' })
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
          margin-bottom: 1.5rem;
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
              <h2 className="welcome-title">Security</h2>
              <h3 className="welcome-subtitle">Account Recovery</h3>
              <p className="welcome-text">
                SecureExam AI uses cryptographic tokens to ensure your account remains safe during the password reset process.
              </p>
            </div>
          </div>

          <div className="right-panel">
            <div className="circle-3"></div>
            
            <div className="right-content">
              <h2 className="form-title">Reset Password</h2>
              <p className="form-subtitle">Enter your email address to receive a secure reset link.</p>
              
              {status.message && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: status.type === 'success' ? '#d1e7dd' : '#f8d7da', 
                  color: status.type === 'success' ? '#0f5132' : '#842029', 
                  borderRadius: '8px', 
                  fontSize: '0.75rem', 
                  marginBottom: '1.5rem', 
                  fontWeight: '500', 
                  textAlign: 'center',
                  border: `1px solid ${status.type === 'success' ? '#badbcc' : '#f5c2c7'}`
                }}>
                  {status.message}
                  {previewUrl && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #badbcc' }}>
                      <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#0f5132', fontWeight: 600, textDecoration: 'underline' }}>
                        Click here to view the simulated email (Development only)
                      </a>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="custom-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="signup-text">
                Remember your password? <Link to="/login" className="signup-link">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
