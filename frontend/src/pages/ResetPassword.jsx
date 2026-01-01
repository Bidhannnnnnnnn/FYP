import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
                            <input
                                type="password"
                                className="form-control"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn">
                            <span>Reset Password</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
