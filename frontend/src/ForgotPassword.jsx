import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from './services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Updated endpoint based on urls.py: SendPasswordResetEmail
            const response = await api.post('user/SendPasswordResetEmail/', { email });
            setMessage('Password reset link sent to your email. Please check your inbox.');
            console.log('Reset Email Sent:', response.data);
        } catch (error) {
            console.error('Reset Request Failed:', error);
            setMessage('Failed to send reset link. Please try again.');
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
                    <p style={{ marginBottom: '30px', textAlign: 'center' }}>Enter your email to receive a reset link.</p>

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

                        <button type="submit" className="login-btn" style={{ width: '250px' }}>
                            <span>Send Reset Link</span>
                        </button>

                        <Link to="/login" style={{ marginTop: '20px', color: 'black', textDecoration: 'none' }}>Back to Login</Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
