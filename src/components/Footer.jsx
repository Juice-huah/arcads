// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useAuth } from '../context/LogInAuthenticate';

function Footer() {
  const { userLoggedIn } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" style={{ padding: '40px 5%', backgroundColor: '#0b1120', color: 'white' }}>
      
      {/* 🟢 MOBILE RESPONSIVE CSS INJECTION */}
      <style>{`
        @media (max-width: 768px) {
          .cta-buttons { flex-direction: column; gap: 15px; width: 100%; padding: 0 20px; }
          .cta-buttons .btn { width: 100%; text-align: center; }
          .footer-main { flex-direction: column; gap: 40px; text-align: center; }
          .footer-about { align-items: center; margin: 0 auto; }
          .footer-links { flex-direction: column; gap: 30px; text-align: center; }
          .social-icons { justify-content: center; }
        }
      `}</style>

      {/* Smart CTA SECTION */}
      {!userLoggedIn && (
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 'clamp(0.8rem, 3vw, 1rem)', lineHeight: '1.5', letterSpacing: '1px', marginBottom: '20px' }}>
              READY TO GAMIFY YOUR CLASSROOM?
            </h3>
            <div className="cta-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <Link to="/signup" className="btn btn-primary">Teacher Sign Up</Link>
                <Link to="/student-signup" className="btn btn-secondary">Student Sign Up</Link>
            </div>
        </div>
      )}

      <div className="footer-main" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px' }}>
        <div className="footer-about" style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
          <div className="logo" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '15px', color: '#0ac8f0' }}>
            ARCADS
          </div>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
            Transforming everyday online activities into engaging, interactive gaming experiences.
          </p>
          <div className="social-icons" style={{ display: 'flex', gap: '15px', fontSize: '1.5rem', color: '#fff' }}>
            <a href="#" target="_blank" rel="noreferrer" style={{ color: 'white' }}><FaFacebook /></a>
            <a href="#" target="_blank" rel="noreferrer" style={{ color: 'white' }}><FaTwitter /></a>
            <a href="#" target="_blank" rel="noreferrer" style={{ color: 'white' }}><FaInstagram /></a>
            <a href="#" target="_blank" rel="noreferrer" style={{ color: 'white' }}><FaLinkedin /></a>
          </div>
        </div>

        <div className="footer-links" style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          <div className="links-column" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '10px', color: '#fca311' }}>Platform</h4>
            <Link to="/games" style={{ color: '#aaa', textDecoration: 'none' }}>Game Library</Link>
            <Link to="/teacher-login" style={{ color: '#aaa', textDecoration: 'none' }}>Teacher Portal</Link>
            <Link to="/student-login" style={{ color: '#aaa', textDecoration: 'none' }}>Student Portal</Link>
          </div>

          <div className="links-column" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '10px', color: '#fca311' }}>Support</h4>
            <Link to="/contact" style={{ color: '#aaa', textDecoration: 'none' }}>Contact Us</Link>
            <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>FAQ</a>
            <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Scoring Guide</a>
          </div>

          <div className="links-column" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '10px', color: '#fca311' }}>Legal</h4>
            <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#666', fontSize: '0.8rem' }}>
        <p>&copy; {currentYear} ARCADS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;