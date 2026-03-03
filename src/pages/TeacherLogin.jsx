// src/components/TeacherLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; // Imported signOut
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
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. THE BOUNCER: Check if this UID actually exists in the MySQL 'teacher' table
      const res = await fetch(`http://localhost:8081/api/check-teacher/${user.uid}`);
      const data = await res.json();

      if (data.isTeacher) {
          // Success! Let them in.
          console.log("Teacher logged in:", user.email);
          setMessage('Login Successful! Redirecting...');
          
          setTimeout(() => {
            navigate('/teacher-menu');
          }, 1000);
      } else {
          // Wrong portal! Force logout and show error.
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
        <h1>Teacher Login</h1>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
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
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>
        
        <button type="submit" className="btn btn-primary btn-full-width">
          Login
        </button>

        {message && (
          <p 
            className="signup-message" 
            style={{ 
              color: message.includes('Successful') ? '#fca311' : 'red', 
              textAlign: 'center', 
              marginTop: '15px' 
            }}
          >
            {message}
          </p>
        )}
        
        <p className="login-link">
          Not a teacher? <a href="/student-login">Student Login</a>
        </p>
      </form>
    </div>
  );
}

export default TeacherLogin;