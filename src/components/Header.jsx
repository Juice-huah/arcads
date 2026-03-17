// src/components/Header.jsx
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/LogInAuthenticate'; 
import { FaTimes, FaUserCircle } from 'react-icons/fa';

function Header() {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 🟢 NEW: Check if the user is a student or teacher from local storage
  // (Adjust the key 'role' or 'userRole' based on what you used in your Login files)
  const userRole = localStorage.getItem('role') || localStorage.getItem('userRole'); 
  const dashboardRoute = userRole === 'student' ? '/student-menu' : '/teacher-menu';

  // Popups
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
      // Clear the role from storage when logging out
      localStorage.removeItem('role'); 
      localStorage.removeItem('userRole');
      setShowLogoutConfirm(false); 
      navigate('/'); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        
        <Link to="/" className="logo">ARCADS</Link>

        <nav className="main-nav">
          <ul className="nav-links">
            <li>
              {/* 🟢 CHANGED: Now uses the dynamic dashboardRoute */}
              <NavLink 
                to={userLoggedIn ? dashboardRoute : "/games"} 
                className={({ isActive }) => isActive ? "active-link" : ""}
              >
                {userLoggedIn ? "Dashboard" : "Games"}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => isActive ? "active-link" : ""}
              >
                Contact Us
              </NavLink>
            </li>
            
            {userLoggedIn ? (
              <li>
                <button onClick={handleAccountClick} className="logout-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUserCircle size={26} /> Account
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
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: '20px' }}>LOGIN AS:</h2>
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
            
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: '20px' }}>MY ACCOUNT</h2>

            <div className="modal-actions">
              <Link to="/profile" className="btn btn-primary modal-btn" onClick={() => setShowAccountModal(false)}>
                Account Settings
              </Link>
              <button onClick={handleLogoutClick} className="btn btn-secondary modal-btn" style={{width: '100%'}}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ fontSize: '1.2rem', lineHeight: '1.5', fontFamily: "'Orbitron', sans-serif", marginBottom: '20px' }}>
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