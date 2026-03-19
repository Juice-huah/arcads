import React, { useState } from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../components/TeacherMenu.css'; 
import './GamesCSS.css'; // Importing this to use the game-card and game-input classes!

function ContactUs() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [alertData, setAlertData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlertData({
      title: "MESSAGE SENT!",
      message: "Thank you for reaching out. Our support team will get back to you shortly.",
      color: "#0ac8f0"
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="teacher-dashboard" style={{ display: 'block', padding: '60px 20px', minHeight: '100vh', overflowY: 'auto' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#0ac8f0', fontSize: '2rem', margin: '0 0 15px 0', fontFamily: "'Press Start 2P', cursive", lineHeight: '1.5' }}>
            CONTACT US
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Have a question about ARCADS? Need help setting up your classroom? Send us a message and we'll be happy to assist you!
          </p>
        </div>

        {/* 2-COLUMN GRID USING YOUR CSS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          {/* LEFT SIDE: CONTACT INFO (Using game-card class) */}
          <div className="game-card" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#ff9900', marginBottom: '30px', borderBottom: '2px solid rgba(255, 153, 0, 0.3)', paddingBottom: '15px', fontFamily: "'Press Start 2P', cursive", fontSize: '1rem', lineHeight: '1.5' }}>
              GET IN TOUCH
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, justifyContent: 'center' }}>
                <div style={infoRowStyle}>
                <div style={iconBoxStyle}><FaEnvelope /></div>
                <div>
                    <h4 style={infoTitleStyle}>Email</h4>
                    <p style={infoTextStyle}>jushuaostraes@gmail.com</p>
                    <p style={infoTextStyle}>kevinearlabuan04@gmail.com</p>
                </div>
                </div>

                <div style={infoRowStyle}>
                <div style={iconBoxStyle}><FaPhoneAlt /></div>
                <div>
                    <h4 style={infoTitleStyle}>Phone</h4>
                    <p style={infoTextStyle}>+63 926 732 0613</p>
                    <p style={infoTextStyle}>Mon-Fri, 8am - 5pm</p>
                </div>
                </div>

                <div style={infoRowStyle}>
                <div style={iconBoxStyle}><FaMapMarkerAlt /></div>
                <div>
                    <h4 style={infoTitleStyle}>Location</h4>
                    <p style={infoTextStyle}>Technological Univeristy of the Philippines</p>
                    <p style={infoTextStyle}>Manila, Philippines</p>
                </div>
                </div>
            </div>
          </div>

          {/* RIGHT SIDE: CONTACT FORM (Using game-card and game-input classes) */}
          <div className="game-card" style={{ margin: 0, height: '100%' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="grid-2">
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Your Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="game-input" placeholder="Juan Dela Cruz" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Your Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="game-input" placeholder="juan@example.com" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="game-input" placeholder="How can we help?" />
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required className="game-input" style={{ minHeight: '120px', resize: 'vertical', paddingTop: '10px' }} placeholder="Type your message here..." />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '15px' }}>
                SEND MESSAGE
              </button>

            </form>
          </div>

        </div>
      </div>

      {/* --- CUSTOM ALERT MODAL (Using your native classes) --- */}
      {alertData && (
          <div className="modal-overlay">
              <div className="modal-box" style={{ border: `2px solid ${alertData.color}` }}>
                  <h2 style={{ color: alertData.color, marginBottom: '20px', fontFamily: "'Press Start 2P', cursive", fontSize: '1.2rem', lineHeight: '1.5' }}>
                      {alertData.title}
                  </h2>
                  <p style={{ color: '#fff', fontSize: '1rem', marginBottom: '30px', lineHeight: '1.5' }}>
                      {alertData.message}
                  </p>
                  <button className="btn btn-primary" onClick={() => {
                      setAlertData(null);
                      navigate('/'); // Optionally redirect them home after sending
                  }}>
                    AWESOME
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}

// --- STYLES FOR THE ICONS AND TEXT ---
const infoRowStyle = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '20px'
};

const iconBoxStyle = {
  backgroundColor: 'rgba(10, 200, 240, 0.1)', 
  color: '#0ac8f0', 
  fontSize: '1.5rem', 
  width: '50px', 
  height: '50px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  borderRadius: '8px',
  border: '1px solid rgba(10, 200, 240, 0.3)'
};

const infoTitleStyle = {
  margin: '0 0 5px 0', 
  color: '#fff', 
  fontSize: '1.1rem'
};

const infoTextStyle = {
  margin: '0', 
  color: '#aaa', 
  fontSize: '0.9rem'
};

const labelStyle = {
  display: 'block', 
  marginBottom: '8px', 
  color: '#0ac8f0', 
  fontSize: '0.85rem',
  fontWeight: 'bold'
};

export default ContactUs;