// src/components/Header.jsx
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/LogInAuthenticate'; 
import { FaTimes, FaUserCircle, FaBars } from 'react-icons/fa'; // 🟢 Added FaBars for the menu icon

function Header() {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || localStorage.getItem('userRole'); 
  const dashboardRoute = userRole === 'student' ? '/student-menu' : '/teacher-menu';

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // 🟢 NEW: State to track if the mobile hamburger menu is open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAccountClick = () => {
    setShowAccountModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening modals
  };

  const handleLogoutClick = () => {
    setShowAccountModal(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
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
      {/* 🟢 CSS INJECTION: Hamburger Menu & Mobile Layout Fixes */}
      <style>{`
        * { box-sizing: border-box; } /* Prevents padding from causing horizontal scrolling */
        
        .mobile-menu-toggle { display: none; background: transparent; border: none; color: #fca311; font-size: 2rem; cursor: pointer; }
        
        @media (max-width: 768px) {
          .site-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 15px 20px; }
          .mobile-menu-toggle { display: block; }
          
          /* Hide nav by default on mobile, show when toggled */
          .main-nav { display: ${isMobileMenuOpen ? 'block' : 'none'}; width: 100%; margin-top: 15px; }
          .main-nav .nav-links { flex-direction: column; width: 100%; gap: 10px; align-items: center; }
          .main-nav .nav-links li { width: 100%; text-align: center; }
          
          .modal-box { width: 90% !important; padding: 20px !important; }
          .modal-actions { flex-direction: column !important; gap: 10px !important; }
          .modal-actions .btn { width: 100% !important; margin: 0 !important; }
          .modal-actions-row { flex-direction: column; gap: 10px; }
          .modal-actions-row .btn { width: 100%; margin: 0; }
        }
      `}</style>

      <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        
        <Link to="/" className="logo">ARCADS</Link>

        {/* 🟢 NEW: The Hamburger Button */}
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav className="main-nav">
          <ul className="nav-links">
            <li>
              <NavLink 
                to={userLoggedIn ? dashboardRoute : "/games"} 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {userLoggedIn ? "Dashboard" : "Games"}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => isActive ? "active-link" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact Us
              </NavLink>
            </li>
            
            {userLoggedIn ? (
              <li>
                <button onClick={handleAccountClick} className="logout-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                  <FaUserCircle size={26} /> Account
                </button>
              </li>
            ) : (
              <li>
                <button onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }} className="logout-link" style={{ width: '100%' }}>
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* --- MODALS REMAIN THE SAME --- */}
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
              <button onClick={handleLogoutClick} className="btn btn-secondary modal-btn">
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