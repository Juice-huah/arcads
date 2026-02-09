// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { updateEmail, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function UserProfile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [initialUsername, setInitialUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email }));
      fetchUserData(user.uid);
    }
  }, [user]);

  const fetchUserData = async (uid) => {
    try {
      let res = await fetch(`http://localhost:8081/api/check-teacher/${uid}`);
      let data = await res.json();
      
      if (data.isTeacher) {
        setRole('teacher');
        setFormData(prev => ({ ...prev, username: data.teacher.teacher_username }));
        setInitialUsername(data.teacher.teacher_username);
      } else {
        res = await fetch(`http://localhost:8081/api/check-student/${uid}`);
        data = await res.json();
        if (data.isStudent) {
          setRole('student');
          setFormData(prev => ({ ...prev, username: data.student.student_username }));
          setInitialUsername(data.student.student_username);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'username') setUsernameError('');
    if (e.target.name === 'email') setEmailError('');
    if (status.type === 'success') setStatus({ type: '', msg: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setUsernameError('');
    setEmailError('');
    setStatus({ type: '', msg: '' });

    try {
      if (formData.username !== initialUsername) {
        const checkRes = await fetch('http://localhost:8081/api/check-username-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.username, role: role })
        });
        const checkData = await checkRes.json();

        if (!checkData.available) {
            setUsernameError("This username is already taken.");
            return; 
        }
      }

      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setStatus({ type: 'error', msg: "Passwords do not match!" });
          return;
        }
        await updatePassword(user, formData.password);
      }

      const response = await fetch('http://localhost:8081/api/update-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          role: role,
          newUsername: formData.username
        })
      });

      if (response.ok) {
        setStatus({ type: 'success', msg: "PROFILE UPDATED SUCCESSFULLY!" });
        setTimeout(() => { navigate('/'); }, 2000); 
      } else {
        setStatus({ type: 'error', msg: "Failed to update username in database." });
      }

    } catch (error) {
      console.error(error);
      
      if (error.code === 'auth/email-already-in-use') {
        setEmailError("This email is already in use by another account.");
      } 
      else if (error.code === 'auth/requires-recent-login') {
        setStatus({ type: 'error', msg: "Please logout and login again to change sensitive info." });
      } else {
        setStatus({ type: 'error', msg: error.message });
      }
    }
  };

  if (loading) return <div style={{color: 'white', textAlign:'center', marginTop:'50px'}}>Loading Profile...</div>;

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1>Account Settings</h1>
        {status.msg && (
          <div style={{
            textAlign: 'center', marginBottom: '20px', padding: '10px', borderRadius: '4px',
            backgroundColor: status.type === 'error' ? 'rgba(255, 68, 68, 0.2)' : 'rgba(76, 201, 240, 0.2)',
            border: `2px solid ${status.type === 'error' ? '#ff4444' : '#4cc9f0'}`,
            color: status.type === 'error' ? '#ff4444' : '#4cc9f0',
            fontFamily: '"Press Start 2P", cursive', fontSize: '0.7rem'
          }}>
            {status.msg}
          </div>
        )}
        
        <div className="form-group">
          <label>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required className={usernameError ? "input-error" : ""}/>
          {usernameError && <span className="error-text">{usernameError}</span>}
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className={emailError ? "input-error" : ""}/>
          {emailError && <span className="error-text">{emailError}</span>}
        </div>

        <hr style={{borderColor: 'var(--arcade-yellow)', margin: '20px 0'}}/>
        <p style={{color:'white', fontSize:'0.8rem', marginBottom:'10px'}}>Leave password blank to keep it unchanged.</p>

        <div className="form-group">
          <label>New Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="New Password"/>
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm New Password"/>
        </div>

        <button type="submit" className="btn btn-primary btn-full-width">
          SAVE CHANGES
        </button>
      </form>
    </div>
  );
}

export default UserProfile;