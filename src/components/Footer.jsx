// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useAuth } from '../context/LogInAuthenticate';

function Footer() {
  const { userLoggedIn } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      
      {/* Smart CTA SECTION - Only shows if not logged in */}
      {!userLoggedIn && (
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '1rem', lineHeight: '1.5', letterSpacing: '1px', marginBottom: '20px' }}>
              READY TO GAMIFY YOUR CLASSROOM?
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <Link to="/signup" className="btn btn-primary">Teacher Sign Up</Link>
                <Link to="/student-signup" className="btn btn-secondary">Student Sign Up</Link>
            </div>
        </div>
      )}

      <div className="footer-main">
        <div className="footer-about">
          {/* Logo with 8-bit Pixel font */}
          <div className="logo" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '15px' }}>
            ARCADS
          </div>
          <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '250px', marginBottom: '20px', lineHeight: '1.6' }}>
            Transforming everyday online activities into engaging, interactive gaming experiences.
          </p>
          <div className="social-icons">
            <a href="#" target="_blank" rel="noreferrer"><FaFacebook /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaTwitter /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaLinkedin /></a>
          </div>
        </div>

        <div className="footer-links">
          <div className="links-column">
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '20px', lineHeight: '1.4' }}>Platform</h4>
            <Link to="/games">Game Library</Link>
            <Link to="/teacher-login">Teacher Portal</Link>
            <Link to="/student-login">Student Portal</Link>
          </div>

          <div className="links-column">
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '20px', lineHeight: '1.4' }}>Support</h4>
            <Link to="/contact">Contact Us</Link>
            <a href="#">FAQ</a>
            <a href="#">Scoring Guide</a>
          </div>

          <div className="links-column">
            <h4 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem', marginBottom: '20px', lineHeight: '1.4' }}>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} ARCADS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;