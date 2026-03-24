// src/pages/HomePage.jsx
import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/LogInAuthenticate';
import { FaGhost, FaGamepad, FaHeadset, FaRocket, FaTimes } from 'react-icons/fa';

import spaceInvadersImg from '../assets/space-invaders.jpg';
import pacmanImg from '../assets/pacman.png';
import donkeyKongImg from '../assets/donkey-kong.png';

function HomePage() {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('role') || localStorage.getItem('userRole'); 
  const dashboardRoute = userRole === 'student' ? '/student-menu' : '/teacher-menu';

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showTeacherPrompt, setShowTeacherPrompt] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleSeeNowClick = () => {
    if (userLoggedIn) {
      navigate(dashboardRoute); 
    } else {
      setShowTeacherPrompt(true);
    }
  };

  return (
    <main className="homepage-container">
      
      {/* 🟢 CSS INJECTION: Kills horizontal scroll and forces text/buttons to stay inside the screen */}
      <style>{`
        html, body, #root { overflow-x: hidden; width: 100%; margin: 0; padding: 0; }
        .homepage-container { width: 100%; overflow-x: hidden; box-sizing: border-box; }
        * { box-sizing: border-box; }

        @media (max-width: 768px) {
          .hero-logo { font-size: clamp(2rem, 10vw, 4rem) !important; word-wrap: break-word; }
          .tagline { font-size: clamp(0.8rem, 4vw, 1.2rem) !important; }
          
          /* Force buttons to fit */
          .hero-buttons { flex-direction: column; width: 100%; padding: 0 20px; }
          .hero-buttons .btn { width: 100%; margin: 0 !important; }
          
          /* Shrink massive section titles so they don't break the layout */
          .features h2, .content-text h2 { font-size: clamp(1.2rem, 5vw, 2rem) !important; word-wrap: break-word; text-align: center; }
          
          .content-section { flex-direction: column !important; padding: 40px 20px !important; text-align: center; }
          .content-section.reverse { flex-direction: column !important; }
          .content-image { margin-top: 30px; width: 100%; }
          .content-image img { width: 100%; max-width: 300px; height: auto; }
          
          .info-grid { flex-direction: column; padding: 40px 20px !important; gap: 30px; }
          .info-column { width: 100%; text-align: center; }
          
          .feature-icons { flex-wrap: wrap; justify-content: center; gap: 20px; }
        }
      `}</style>

      <section className="hero">
        <h1 className="hero-logo">ARCADS</h1>
        <p className="tagline">MAKING ACTIVITIES FUN!</p>
        
        <div className="hero-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {userLoggedIn ? (
            <Link to={dashboardRoute} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }}>
              PLAY NOW
            </Link>
          ) : (
            <>
              <button onClick={() => openModal('login')} className="btn btn-primary">
                LOGIN
              </button>
              <button onClick={() => openModal('join')} className="btn btn-secondary">
                JOIN
              </button>
            </>
          )}
        </div>

        <div className="hero-image-container" style={{ marginTop: '40px', width: '100%', padding: '0 20px' }}>
          <img src={spaceInvadersImg} alt="Pixelated space aliens game" style={{ maxWidth: '100%', height: 'auto', border: '2px solid #fca311' }} />
        </div>
      </section>

      <section className="features" style={{ width: '100%', padding: '40px 20px', overflow: 'hidden' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>MULTIPLE FUN GAMES</h2>
        <div className="feature-icons" style={{ display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '3rem', color: '#0ac8f0' }}>
          <span><FaGhost /></span>
          <span><FaRocket /></span>
          <span><FaGamepad /></span>
          <span><FaHeadset /></span>
        </div>
      </section>

      {/* --- REST OF THE HOMEPAGE REMAINS THE SAME --- */}
      <section className="content-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '60px 5%' }}>
        <div className="content-text" style={{ flex: 1, maxWidth: '500px' }}>
          <h2 style={{ color: '#0ac8f0', marginBottom: '20px' }}>Diversify Your Activities!</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '30px' }}>Choose from multiple gamified activities to make your activities fun and enjoyable!</p>
          <button className="btn btn-primary" onClick={handleSeeNowClick}>SEE NOW</button>
        </div>
        <div className="content-image" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src={pacmanImg} alt="Pac-Man style game" style={{ maxWidth: '400px', width: '100%' }} />
        </div>
      </section>

      <section className="content-section reverse" style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', padding: '60px 5%', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="content-text" style={{ flex: 1, maxWidth: '500px' }}>
          <h2 style={{ color: '#fca311', marginBottom: '20px' }}>Play Now!</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '30px' }}>Create activities that your students will enjoy! Activities have never been more fun.</p>
          <button className="btn btn-primary" onClick={handleSeeNowClick}>SEE NOW</button>
        </div>
        <div className="content-image" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src={donkeyKongImg} alt="Donkey Kong style game" style={{ maxWidth: '400px', width: '100%' }} />
        </div>
      </section>

      <section className="info-grid" style={{ display: 'flex', justifyContent: 'space-around', padding: '60px 5%', gap: '20px' }}>
        <div className="info-column" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '10px', borderTop: '4px solid #0ac8f0' }}>
          <h3 style={{ color: '#0ac8f0', marginBottom: '15px' }}>Play</h3>
          <p style={{ lineHeight: '1.6' }}>Create gamified activities for your students from templates to make online activities interactive and fun.</p>
        </div>
        <div className="info-column" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '10px', borderTop: '4px solid #fca311' }}>
          <h3 style={{ color: '#fca311', marginBottom: '15px' }}>Leaderboard</h3>
          <p style={{ lineHeight: '1.6' }}>Points gathered by your students are all recorded and are put into a leaderboard to show those who are excelling.</p>
        </div>
        <div className="info-column" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '10px', borderTop: '4px solid #ff4c4c' }}>
          <h3 style={{ color: '#ff4c4c', marginBottom: '15px' }}>Classes</h3>
          <p style={{ lineHeight: '1.6' }}>Group your students into groups or classes for easy dissemination of gamified activities for easier and faster fun.</p>
        </div>
      </section>

      {/* MODALS */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '90%', maxWidth: '400px' }}>
            <button className="close-modal-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{modalType === 'login' ? 'LOGIN AS:' : 'CREATE ACCOUNT:'}</h2>
            <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Link to={modalType === 'login' ? "/teacher-login" : "/signup"} className="btn btn-primary modal-btn" style={{ width: '100%' }}>Teacher</Link>
              <Link to={modalType === 'login' ? "/student-login" : "/student-signup"} className="btn btn-secondary modal-btn" style={{ width: '100%' }}>Student</Link>
            </div>
          </div>
        </div>
      )}

      {showTeacherPrompt && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ border: '2px solid #0ac8f0', textAlign: 'center', width: '90%', maxWidth: '400px' }}>
            <button className="close-modal-btn" onClick={() => setShowTeacherPrompt(false)}><FaTimes /></button>
            <h2 style={{ color: '#0ac8f0', marginBottom: '15px', fontSize: '1.2rem' }}>TEACHER ACCESS REQUIRED</h2>
            <p style={{ marginBottom: '25px', lineHeight: '1.5' }}>You need a Teacher account to create and manage gamified activities.</p>
            <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Link to="/teacher-login" className="btn btn-primary modal-btn" style={{ width: '100%' }}>LOGIN AS TEACHER</Link>
              <Link to="/signup" className="btn btn-secondary modal-btn" style={{ width: '100%' }}>CREATE TEACHER ACCOUNT</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default HomePage;