import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; 
import { auth } from '../firebase'; 

function TeacherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 1. 🟢 THE ADMIN MASTER KEY INTERCEPT (Moved to the very top!)
      if (user.email === 'arcads.admin@gmail.com') {
          // Double-check the exact password typed in the box
          if (password !== '4dm1n1str4t0r') {
              await signOut(auth); // Kick them out immediately
              setMessage('Access Denied: Unauthorized Admin Access Attempt.');
              return;
          }
          
          // If they pass, let them in immediately! (SKIPS VERIFICATION)
          localStorage.setItem('role', 'admin');
          setMessage('Admin Recognized! Accessing Vault...');
          setTimeout(() => { navigate('/admin-dashboard'); }, 1000);
          return; // Stop the rest of the code from running
      }

      // 2. 🟡 Verification check for EVERYONE ELSE (Teachers)
       if (!user.emailVerified) { 
          await signOut(auth); 
          setMessage('Access Denied: Please verify your email address first!');
          return;
      }

      // 3. --- Normal Teacher Login Flow ---
      const res = await fetch(`https://arcads-api.onrender.com/api/check-teacher/${user.uid}`);
      const data = await res.json();

      if (data.isTeacher) {
          localStorage.setItem('role', 'teacher');
          setMessage('Login Successful! Redirecting...');
          setTimeout(() => { navigate('/teacher-menu'); }, 1000);
      } else {
          await signOut(auth);
          setMessage('Access Denied. Are you trying to log in as a Student?');
      }
    } catch (error) {
      console.error('Firebase error:', error);
      setMessage('Invalid email or password.');
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1>Teacher</h1>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="teacher@school.edu"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#fca311' }}>
                Forgot Password?
            </Link>
        </div>
        
        <button type="submit" className="btn btn-primary btn-full-width">Login</button>

        {message && (
          <p className="signup-message" style={{ color: message.includes('Successful') || message.includes('Vault') ? '#fca311' : '#ff4c4c', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
        
        <p className="login-link">
          Not a teacher? <Link to="/student-login">Student Login</Link>
        </p>
      </form>
    </div>
  );
}

export default TeacherLogin;