import React, { useState } from 'react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Check your email inbox (and spam folder) for a reset link!');
        } catch (err) {
            console.error(err);
            setError('Failed to send reset email. Make sure the email is correct.');
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleReset}>
                <h1>Reset Password</h1>
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                    Enter your email and we'll send you a link to get back into your account.
                </p>
                
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="your-email@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full-width">
                    Send Reset Link
                </button>

                {message && <p style={{ color: '#fca311', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
                {error && <p style={{ color: '#ff4c4c', marginTop: '15px', textAlign: 'center' }}>{error}</p>}

                <p className="login-link">
                    Remembered it? <Link to="/student-login">Back to Login</Link>
                </p>
            </form>
        </div>
    );
}

export default ForgotPassword;