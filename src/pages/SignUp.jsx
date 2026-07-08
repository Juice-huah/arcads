// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification, signOut } from "firebase/auth"; 
import { auth } from '../firebase'; 
import './SignUp.css';

function SignUp({ role }) {
  const navigate = useNavigate();
  
  const isStudent = role === 'student';
  const title = isStudent ? "Create Student Account" : "Create Teacher Account";
  const loginRoute = isStudent ? '/student-login' : '/teacher-login';
  const signupEndpoint = isStudent ? '/api/student-signup' : '/api/teacher-signup';
  
  const usernamePlaceholder = isStudent ? "StudentUser" : "Username";
  const emailPlaceholder = isStudent ? "student@school.edu" : "teacher@school.edu";

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'username') setUsernameError('');
    if (name === 'email') setEmailError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrors({});
    setUsernameError('');
    setEmailError('');

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match."});
      return;
    }

    try {
      const response = await fetch('https://arcads-api.onrender.com/api/check-username-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, role })
      });
      const data = await response.json();

      if (!data.available) {
        setUsernameError("This username is already taken.");
        return; 
      }
      setShowConfirmModal(true);

    } catch (error) {
      console.error(error);
      setErrors({ general: "Server error checking username." });
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const response = await fetch(`https://arcads-api.onrender.com${signupEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: formData.name,
          surname: formData.surname,
          username: formData.username
        })
      });

      if (!response.ok) {
        await deleteUser(user);
        throw new Error("Failed to save to database.");
      }

      
      await signOut(auth);

   
      setIsSuccess(true);

      setTimeout(() => {
        navigate(loginRoute);
      }, 4000); 

    } catch (error) {
      const errorCode = error.code;
      let newErrors = {};
      
      if (errorCode === 'auth/email-already-in-use') setEmailError("Email already in use.");
      else if (errorCode === 'auth/weak-password') newErrors.password = "Password weak.";
      else newErrors.general = error.message;
      
      setErrors(newErrors);
      setShowConfirmModal(false); 
    }
  };

  return (
    <div className="signup-container">
       <form className="signup-form" onSubmit={handleVerify}>
          <h1>{title}</h1>
          {errors.general && <p className="error-text" style={{textAlign:'center'}}>{errors.general}</p>}
        
        <div className="form-group">
          <label htmlFor="name">First Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Name"/>
        </div>

        <div className="form-group">
          <label htmlFor="surname">Last Name</label>
          <input type="text" name="surname" value={formData.surname} onChange={handleChange} required placeholder="Surname"/>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder={usernamePlaceholder} className={usernameError ? "input-error" : ""}/>
          {usernameError && <span className="error-text">{usernameError}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder={emailPlaceholder} className={emailError ? "input-error" : ""}/>
          {emailError && <span className="error-text">{emailError}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className={errors.password ? "input-error" : ""}/>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={errors.confirmPassword ? "input-error" : ""}/>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>
        
        <button type="submit" className="btn btn-primary btn-full-width">
          Create Account
        </button>

        <p className="login-link">
          Already have an account? <Link to={loginRoute}>Login</Link>
        </p>
      </form>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            
            {isSuccess ? (
              <div className="success-content">
                <h2 style={{color: '#4cc9f0'}}>SUCCESS!</h2>
                <p style={{color: 'white', marginTop: '20px', lineHeight: '1.5'}}>
                  Account created! <br/><br/>
                  <strong style={{color: '#fca311'}}>IMPORTANT:</strong> We sent a verification link to your email. Please verify your email before logging in!
                </p>
                <p style={{color: '#aaa', fontSize: '0.8rem', marginTop: '15px'}}>
                  Redirecting to Login Page...
                </p>
              </div>
            ) : (
              <>
                <h2>CONFIRM DETAILS</h2>
                <p style={{color: '#fff', fontSize: '0.8rem', fontFamily: 'Arial, sans-serif', marginBottom: '15px'}}>Please check your information:</p>
                <div style={{textAlign: 'left', color: 'var(--arcade-yellow)', fontSize: '0.9rem', margin: '10px auto', width: '80%'}}>
                  <p><strong>Name:</strong> {formData.name} {formData.surname}</p>
                  <p><strong>Username:</strong> {formData.username}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                </div>
                <p style={{color: '#fff', fontSize: '0.8rem', marginTop: '20px'}}>Is this correct?</p>
                <div className="modal-actions-row">
                  <button type="button" onClick={handleFinalSubmit} className="btn btn-primary">YES, CREATE</button>
                  <button type="button" onClick={() => setShowConfirmModal(false)} className="btn btn-secondary">NO, EDIT</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;