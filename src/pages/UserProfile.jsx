// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
// 🟢 NEW: Imported EmailAuthProvider, reauthenticateWithCredential, and deleteUser
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function UserProfile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [initialUsername, setInitialUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', msg: '' });

  // 🟢 NEW: State for the Delete Account flow
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid);
    }
  }, [user]);

  const fetchUserData = async (uid) => {
    try {
      let res = await fetch(`https://arcads-api.onrender.com/api/check-teacher/${uid}`);
      let data = await res.json();
      
      if (data.isTeacher) {
        setRole('teacher');
        setFormData(prev => ({ ...prev, username: data.teacher.teacher_username }));
        setInitialUsername(data.teacher.teacher_username);
      } else {
        res = await fetch(`https://arcads-api.onrender.com/api/check-student/${uid}`);
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
    if (status.type === 'success') setStatus({ type: '', msg: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setUsernameError('');
    setStatus({ type: '', msg: '' });

    try {
      if (formData.username !== initialUsername) {
        const checkRes = await fetch('https://arcads-api.onrender.com/api/check-username-availability', {
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

      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setStatus({ type: 'error', msg: "Passwords do not match!" });
          return;
        }
        await updatePassword(user, formData.password);
      }

      const response = await fetch('https://arcads-api.onrender.com/api/update-username', {
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
      if (error.code === 'auth/requires-recent-login') {
        setStatus({ type: 'error', msg: "Please logout and login again to change sensitive info like your password." });
      } else {
        setStatus({ type: 'error', msg: error.message });
      }
    }
  };

  // 🟢 NEW: Handles the actual deletion process
  const executeDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);

    try {
      // 1. Re-authenticate the user with the password they just typed
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Delete data from MySQL
      const dbRes = await fetch('https://arcads-api.onrender.com/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, role: role })
      });

      if (!dbRes.ok) throw new Error("Failed to delete records from MySQL");

      // 3. Delete from Firebase
      await deleteUser(user);

      // 4. Clean up local storage and redirect
      localStorage.removeItem('role');
      localStorage.removeItem('userRole');
      navigate('/');

    } catch (error) {
      console.error(error);
      setIsDeleting(false);
      if (error.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('An error occurred while deleting your account.');
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
            fontFamily: '"Press Start 2P", cursive', fontSize: '0.7rem', lineHeight: '1.5'
          }}>
            {status.msg}
          </div>
        )}
        
        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              color: '#888', 
              cursor: 'not-allowed', 
              border: '1px solid #444' 
            }}
          />
          <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px', display: 'block' }}>Email cannot be changed.</span>
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required className={usernameError ? "input-error" : ""}/>
          {usernameError && <span className="error-text">{usernameError}</span>}
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

        <button type="submit" className="btn btn-primary btn-full-width" style={{marginBottom: '15px'}}>
          SAVE CHANGES
        </button>

        {/* 🟢 NEW: Delete Button */}
        <button 
          type="button" 
          onClick={() => setShowDeleteWarning(true)} 
          style={{
            width: '100%', padding: '15px', backgroundColor: 'transparent', 
            color: '#ff4c4c', border: '2px solid #ff4c4c', borderRadius: '5px', 
            fontFamily: '"Press Start 2P", cursive', fontSize: '0.8rem', cursor: 'pointer'
          }}
        >
          DELETE ACCOUNT
        </button>
      </form>

      {/* 🟢 NEW: Initial Warning Modal */}
      {showDeleteWarning && (
        <div className="modal-overlay">
          <div className="modal-box" style={{border: '2px solid #ff4c4c'}}>
            <h2 style={{color: '#ff4c4c', fontFamily: '"Press Start 2P", cursive', fontSize: '1.2rem', marginBottom: '20px'}}>WARNING!</h2>
            <p style={{color: 'white', lineHeight: '1.5', marginBottom: '25px'}}>
              Are you sure you want to permanently delete your account? <br/><br/>
              This will erase all your data, scores, and history. <strong>This action cannot be undone.</strong>
            </p>
            <div className="modal-actions-row">
              <button onClick={() => {
                setShowDeleteWarning(false);
                setShowReauthModal(true);
              }} className="btn" style={{backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '10px 20px', fontFamily: '"Orbitron", sans-serif', fontWeight: 'bold'}}>YES, I'M SURE</button>
              <button onClick={() => setShowDeleteWarning(false)} className="btn btn-secondary">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 NEW: Re-authentication Security Modal */}
      {showReauthModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{border: '2px solid #ff4c4c'}}>
            <h2 style={{color: '#ff4c4c', fontFamily: '"Press Start 2P", cursive', fontSize: '1rem', marginBottom: '20px'}}>SECURITY CHECK</h2>
            <p style={{color: 'white', fontSize: '0.9rem', marginBottom: '15px'}}>
              Please enter your password to confirm deletion.
            </p>
            
            <form onSubmit={executeDeleteAccount}>
              <input 
                type="password" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                placeholder="Your Password"
                style={{width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #ff4c4c', borderRadius: '4px'}}
              />
              
              {deleteError && <p style={{color: '#ff4c4c', fontSize: '0.8rem', marginBottom: '15px', fontWeight: 'bold'}}>{deleteError}</p>}
              
              <div className="modal-actions-row">
                <button type="submit" disabled={isDeleting} className="btn" style={{backgroundColor: '#ff4c4c', color: 'white', border: 'none', padding: '10px 20px', fontFamily: '"Orbitron", sans-serif', fontWeight: 'bold', opacity: isDeleting ? 0.5 : 1}}>
                  {isDeleting ? 'DELETING...' : 'DELETE FOREVER'}
                </button>
                <button type="button" onClick={() => {
                  setShowReauthModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }} className="btn btn-secondary">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;