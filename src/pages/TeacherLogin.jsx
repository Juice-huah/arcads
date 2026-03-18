import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
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
      
       if (false) { 
          await signOut(auth); 
          setMessage('Access Denied: Please verify your email address first!');
          return;
      }

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
        <h1>Teacher Login</h1>
        
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

        {/* Added Forgot Password Link */}
        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#fca311' }}>
                Forgot Password?
            </Link>
        </div>
        
        <button type="submit" className="btn btn-primary btn-full-width">Login</button>

        {message && (
          <p className="signup-message" style={{ color: message.includes('Successful') ? '#fca311' : '#ff4c4c', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
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