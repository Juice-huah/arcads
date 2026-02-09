import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase'; 

// src/pages/StudentLogin.jsx

function StudentLogin() {
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
            console.log("Student logged in:", user.email);

            setMessage('Login Successful! Redirecting...');
            
            setTimeout(() => {
                navigate('/student-menu');
            }, 1000);

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
                            color: message.includes('Successful') ? '#fca311' : 'red', 
                            textAlign: 'center', 
                            marginTop: '15px' 
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