import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { validatePassword } from '../utils/validation';
import './AuthPage.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { id, token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            await api.post(`user/reset-password/${id}/${token}/`, { password, password2: confirmPassword });
            alert('Password Reset Successful! Please Login with your new password.');
            navigate('/login');
        } catch (error) {
            console.error('Password Reset Failed:', error);
            alert('Failed to reset password. Link may be expired.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card" style={{ height: 'auto', minHeight: '500px' }}>
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                </div>

                <div className="login-section">
                    <h1 className="login-title" style={{ fontSize: '36px' }}>New Password</h1>

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="form-group">
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setPassword(v);
                                        if (v && !validatePassword(v)) setPasswordError('Password must be 8+ chars (upper, number, symbol)');
                                        else if (confirmPassword && v !== confirmPassword) setPasswordError('Passwords do not match');
                                        else setPasswordError('');
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" /></svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" /><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="form-control"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setConfirmPassword(v);
                                        if (password && v !== password) setPasswordError('Passwords do not match');
                                        else if (!validatePassword(password)) setPasswordError('Password must be 8+ chars (upper, number, symbol)');
                                        else setPasswordError('');
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" /></svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" /><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" /></svg>
                                    )}
                                </button>
                            </div>
                            {passwordError && <p style={{ fontSize: '12px', color: '#EF4444', margin: '8px 0 0', width: '100%', textAlign: 'left' }}>{passwordError}</p>}
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn full-width"
                            disabled={!password || !confirmPassword || !validatePassword(password) || password !== confirmPassword}
                            title={(!password || !confirmPassword || !validatePassword(password) || password !== confirmPassword) ? 'Please resolve the password errors above' : ''}
                        >
                            <span>Reset Password</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
