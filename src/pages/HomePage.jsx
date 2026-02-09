// src/pages/HomePage.jsx
import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';
import { useAuth } from '../context/LogInAuthenticate';
import { FaGhost, FaGamepad, FaHeadset, FaRocket, FaTimes } from 'react-icons/fa';

import spaceInvadersImg from '../assets/space-invaders.jpg';
import pacmanImg from '../assets/pacman.png';
import donkeyKongImg from '../assets/donkey-kong.png';

function HomePage() {
  const { userLoggedIn } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <main className="homepage-container">
      <section className="hero">
        <h1 className="hero-logo">ARCADS</h1>
        <p className="tagline">MAKING ACTIVITIES FUN!</p>
        
        <div className="hero-buttons">
          {userLoggedIn ? (
            <Link to="/teacher-menu" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }}>
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

        <div className="hero-image-container">
          <img src={spaceInvadersImg} alt="Pixelated space aliens game" />
        </div>
      </section>

      <section className="features">
        <h2>MULTIPLE FUN GAMES</h2>
        <div className="feature-icons">
          <span><FaGhost /></span>
          <span><FaRocket /></span>
          <span><FaGamepad /></span>
          <span><FaHeadset /></span>
        </div>
      </section>

      <section className="content-section">
        <div className="content-text">
          <h2>Diversify Your Activities!</h2>
          <p>Choose from multiple gamified activities to make your activities fun and enjoyable!</p>
          <button className="btn btn-primary">SEE NOW</button>
        </div>
        <div className="content-image">
          <img src={pacmanImg} alt="Pac-Man style game" />
        </div>
      </section>

      <section className="content-section reverse">
        <div className="content-text">
          <h2>Play Now!</h2>
          <p>Create activities that your students will enjoy! Activities have never been more fun.</p>
          <button className="btn btn-primary">See Now</button>
        </div>
        <div className="content-image">
          <img src={donkeyKongImg} alt="Donkey Kong style game" />
        </div>
      </section>

      <section className="info-grid">
        <div className="info-column">
          <h3>Play</h3>
          <p>Create gamified activities for your students from templates to make online activities interactive and fun.</p>
        </div>
        <div className="info-column">
          <h3>Leaderboard</h3>
          <p>Points gathered by your students are all recorded and are put into a leaderboard to show those who are excelling.</p>
        </div>
        <div className="info-column">
          <h3>Classes</h3>
          <p>Group your students into groups or classes for easy dissemination of gamified activities for easier and faster fun.</p>
        </div>
      </section>


   
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              <FaTimes />
            </button>
            
            <h2>
              {modalType === 'login' ? 'LOGIN AS:' : 'CREATE ACCOUNT:'}
              </h2>

            <div className="modal-actions">
              {/* TEACHER BUTTON */}
              <Link to={modalType === 'login' ? "/teacher-login" : "/signup"} className="btn btn-primary modal-btn">Teacher</Link>
              {/* STUDENT BUTTON */}
              <Link to={modalType === 'login' ? "/student-login" : "/student-signup"} className="btn btn-secondary modal-btn">Student</Link>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default HomePage;