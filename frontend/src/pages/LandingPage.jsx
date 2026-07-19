import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background-color: #f8f9fa;
          color: #212529;
          overflow-x: hidden;
        }

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1.5rem 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .navbar.scrolled {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          padding: 1rem 5%;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #087990;
          text-decoration: none;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo span {
          color: #0dcaf0;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-link {
          text-decoration: none;
          color: #495057;
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #087990;
        }

        .btn-nav-primary {
          background: linear-gradient(135deg, #0dcaf0 0%, #087990 100%);
          color: white;
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-nav-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(13, 202, 240, 0.3);
          color: white;
        }

        /* Hero Section */
        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 6rem 5% 0;
          position: relative;
          background: linear-gradient(135deg, #f0fcff 0%, #ffffff 100%);
          overflow: hidden;
        }

        .hero-content {
          flex: 1;
          max-width: 600px;
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(13, 202, 240, 0.1);
          color: #087990;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          color: #1a1d20;
          margin-bottom: 1.5rem;
        }

        .hero-title span {
          color: #0dcaf0;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 2.5rem;
          max-width: 500px;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0dcaf0 0%, #087990 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(13, 202, 240, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(13, 202, 240, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #495057;
          border: 1px solid #dee2e6;
        }

        .btn-secondary:hover {
          border-color: #0dcaf0;
          color: #087990;
        }

        /* Abstract Hero Graphic */
        .hero-visual {
          flex: 1;
          position: relative;
          height: 600px;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
        }

        .glass-card {
          width: 400px;
          height: 300px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 25px 50px rgba(0,0,0,0.05);
          position: relative;
          z-index: 2;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transform: perspective(1000px) rotateY(-15deg);
        }

        .glass-header {
          display: flex;
          gap: 0.5rem;
        }
        
        .glass-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e9ecef;
        }
        .glass-dot.red { background: #ff5f56; }
        .glass-dot.yellow { background: #ffbd2e; }
        .glass-dot.green { background: #27c93f; }

        .glass-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .skeleton-line {
          height: 16px;
          background: #f1f3f5;
          border-radius: 8px;
          width: 100%;
        }

        .skeleton-line.short {
          width: 60%;
        }

        .skeleton-box {
          height: 100px;
          background: linear-gradient(135deg, rgba(13,202,240,0.1), rgba(8,121,144,0.1));
          border: 1px dashed rgba(13,202,240,0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #087990;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .blob-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: #0dcaf0;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.2;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          animation: float 6s ease-in-out infinite;
        }

        .blob-2 {
          position: absolute;
          width: 300px;
          height: 300px;
          background: #087990;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.15;
          top: 20%;
          right: 10%;
          z-index: 0;
          animation: float 8s ease-in-out infinite reverse;
        }

        @keyframes float {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -60%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }

        /* Features Section */
        .features-section {
          padding: 8rem 5%;
          background: #ffffff;
        }

        .section-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #212529;
          margin-bottom: 1rem;
        }

        .section-desc {
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          padding: 2.5rem;
          border-radius: 24px;
          background: #f8f9fa;
          border: 1px solid #f1f3f5;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          transform: translateY(-5px);
          border-color: #0dcaf0;
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(13, 202, 240, 0.1);
          color: #087990;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .feature-icon svg {
          width: 32px;
          height: 32px;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #212529;
        }

        .feature-text {
          color: #6c757d;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* CTA Section */
        .cta-section {
          padding: 6rem 5%;
          background: linear-gradient(135deg, #0dcaf0 0%, #087990 100%);
          color: white;
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .cta-desc {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-cta {
          background: white;
          color: #087990;
          padding: 1.2rem 3rem;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 50px;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        /* Footer */
        .footer {
          padding: 3rem 5%;
          background: #1a1d20;
          color: rgba(255,255,255,0.7);
          text-align: center;
          font-size: 0.9rem;
        }

        .footer p {
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            text-align: center;
            padding-top: 8rem;
          }
          .hero-content {
            margin-bottom: 3rem;
          }
          .hero-actions {
            justify-content: center;
            flex-direction: column;
          }
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-visual {
            width: 100%;
            height: 400px;
          }
          .glass-card {
            transform: none;
            width: 90%;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Secure<span>Exam</span>
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/register" className="btn-nav-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Exam Security</div>
          <h1 className="hero-title">
            Flawless Proctoring for the <span>Modern Era</span>
          </h1>
          <p className="hero-desc">
            Empower your institution with AI-driven academic integrity. Monitor behavior, analyze performance, and deliver secure exams without the friction.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-large btn-primary">
              Start for Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link to="/login" className="btn-large btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="blob-1"></div>
          <div className="blob-2"></div>
          
          <div className="glass-card">
            <div className="glass-header">
              <div className="glass-dot red"></div>
              <div className="glass-dot yellow"></div>
              <div className="glass-dot green"></div>
            </div>
            <div className="glass-body">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
              <div className="skeleton-box">
                AI Vision Active
              </div>
              <div className="skeleton-line"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything you need to secure exams</h2>
          <p className="section-desc">
            A comprehensive suite of tools designed by educators and secured by advanced AI models.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h3 className="feature-title">AI Vision Perception</h3>
            <p className="feature-text">
              Real-time pose estimation and facial recognition ensure the correct student is always in frame and focused.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Actionable Analytics</h3>
            <p className="feature-text">
              Rich dashboards give educators an instant overview of class performance and potential integrity flags.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="feature-title">Tamper-Proof Proofs</h3>
            <p className="feature-text">
              High-resolution snapshots and encrypted logs are securely stored for every potential violation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to modernize your exams?</h2>
        <p className="cta-desc">
          Join thousands of institutions already using SecureExam AI to deliver flawless, secure, and stress-free digital assessments.
        </p>
        <Link to="/register" className="btn-cta">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} SecureExam AI. All rights reserved.</p>
        <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Designed with precision for remote education.</p>
      </footer>
    </>
  )
}
