import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AuthPage.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setMessage('');
        
        try {
            // Updated endpoint based on urls.py: SendPasswordResetEmail
            const response = await api.post('user/SendPasswordResetEmail/', { email });
            setMessage('Password reset OTP sent to your email. Redirecting...');
            console.log('Reset Email Sent:', response.data);
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 1500);
        } catch (error) {
            console.error('Reset Request Failed:', error);
            setMessage('Failed to send reset link. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card" style={{ height: 'auto', minHeight: '500px' }}>
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                </div>

                <div className="login-section">
                    <h1 className="login-title" style={{ fontSize: '36px' }}>Reset Password</h1>
                    <p style={{ marginBottom: '30px', textAlign: 'center' }}>Enter your email to receive a 6-digit OTP verification code.</p>

                    {message && <p style={{ color: message.includes('Failed') ? 'red' : 'green', marginBottom: '20px' }}>{message}</p>}

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="form-group">
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" style={{ width: '250px' }} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    Sending OTP...
                                </span>
                            ) : (
                                <span>Send OTP Code</span>
                            )}
                        </button>

                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

                        <Link to="/login" style={{ marginTop: '20px', color: 'black', textDecoration: 'none' }}>Back to Login</Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
