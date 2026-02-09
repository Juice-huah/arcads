// src/components/Footer.jsx
import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about">
          <div className="logo">ARCADS</div>
          <div className="social-icons">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
          </div>
        </div>
        <div className="footer-links">
          <div className="links-column">
            <h4>Resources</h4>
            <a href="#">Link 1</a>
            <a href="#">Link 2</a>
            <a href="#">Link 3</a>
          </div>
          <div className="links-column">
            <h4>Links</h4>
            <a href="#">Link 4</a>
            <a href="#">Link 5</a>
            <a href="#">Link 6</a>
          </div>
          <div className="links-column">
            <h4>Help</h4>
            <a href="#">Link 7</a>
            <a href="#">Link 8</a>
            <a href="#">Link 9</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 ARCADS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;