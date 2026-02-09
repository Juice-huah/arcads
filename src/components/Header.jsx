// src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/LogInAuthenticate'; 
import { FaTimes, FaUserCircle } from 'react-icons/fa';

function Header() {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Mga popups
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAccountClick = () => {
    setShowAccountModal(true);
  };

  const handleLogoutClick = () => {
    setShowAccountModal(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false); 
      navigate('/'); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">ARCADS</Link>

        <nav className="main-nav">
          <ul className="nav-links">
            <li><Link to="/games">Games</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            
            {userLoggedIn ? (
              <li>
                <button onClick={handleAccountClick} className="logout-link">
                  Account
                </button>
              </li>
            ) : (
              <li>
                <button onClick={() => setShowLoginModal(true)} className="logout-link">
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>
              <FaTimes />
            </button>
            <h2>LOGIN AS:</h2>
            <div className="modal-actions">
              <Link to="/teacher-login" className="btn btn-primary modal-btn" onClick={() => setShowLoginModal(false)}>
                Teacher
              </Link>
              <Link to="/student-login" className="btn btn-secondary modal-btn" onClick={() => setShowLoginModal(false)}>
                Student
              </Link>
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-modal-btn" onClick={() => setShowAccountModal(false)}>
              <FaTimes />
            </button>
            
            <h2>MY ACCOUNT</h2>

            <div className="modal-actions">
              <Link to="/profile" className="btn btn-primary modal-btn" onClick={() => setShowAccountModal(false)}>
                Account Settings
              </Link>
              <button onClick={handleLogoutClick} className="btn btn-secondary modal-btn"  style={{width: '100%'}}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOGOUT CONFIRMATION --- */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to logout?
            </h2>
            <div className="modal-actions-row">
              <button onClick={confirmLogout} className="btn btn-primary">YES</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-secondary">NO</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;