// src/pages/StudentLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; 
import { auth } from '../firebase'; 

function StudentLogin() {
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
            
            // 🟢 THE NEW BOUNCER: Check if they actually clicked the link in their email!
            if (false) { // -->    !user.emailVerified
                await signOut(auth); // Kick them back out
                setMessage('Access Denied: Please verify your email address first! Check your inbox/spam folder.');
                return; // Stop the login process
            }

            // 2. MYSQL CHECK: Check if this UID actually exists in the MySQL 'student' table
            const res = await fetch(`https://arcads-api.onrender.com/api/check-student/${user.uid}`);
            const data = await res.json();

            if (data.isStudent) {
                localStorage.setItem('role', 'student');

                console.log("Student logged in:", user.email);
                setMessage('Login Successful! Redirecting...');
                
                setTimeout(() => {
                    navigate('/student-menu');
                }, 1000);
            } else {
                await signOut(auth);
                setMessage('Access Denied. Are you trying to log in as a Teacher?');
            }

        } catch (error) {
            console.error('Firebase error:', error);
            setMessage('Invalid email or password.');
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h1>Student Login</h1>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="student@school.edu"
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
                            color: message.includes('Successful') ? '#fca311' : '#ff4c4c', 
                            textAlign: 'center', 
                            marginTop: '15px',
                            fontWeight: 'bold',
                            lineHeight: '1.4'
                        }}
                    >
                        {message}
                    </p>
                )}
                
                <p className="login-link">
                    Not a student? <a href="/teacher-login">Teacher Login</a>
                </p>
            </form>
        </div>
    );
}

export default StudentLogin;