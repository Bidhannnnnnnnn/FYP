import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AuthPage.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        const token = localStorage.getItem('access_token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        try {
            await api.post('user/changepassword/', { old_password: oldPassword, password, password2: confirmPassword }, config);
            setMessage('Password change successful!');
            setIsSuccess(true);
            setOldPassword('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Change Password Failed:', error);
            let errorMsg = 'Failed to change password.';
            if (error.response?.data?.errors) {
                // Formatting specific non check_password error from serializer
                if (error.response.data.errors.non_field_errors) {
                    errorMsg = error.response.data.errors.non_field_errors[0];
                } else {
                    errorMsg = JSON.stringify(error.response.data.errors);
                }
            } else if (error.response?.data?.non_field_errors) {
                errorMsg = error.response.data.non_field_errors[0];
            } else if (error.response?.data && Array.isArray(error.response.data)) {
                errorMsg = error.response.data[0];
            } else if (error.response?.data) {
                // If it's a specific validation error like {'non_field_errors': ['Old password is not correct.']}
                errorMsg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
            }
            // cleanup stringify
            errorMsg = errorMsg.replace(/["{}\\[\\]]/g, '').replace(/old_password:/g, '');
            setMessage(errorMsg);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card" style={{ height: 'auto', minHeight: '500px' }}>
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                </div>

                <div className="login-section">
                    <h1 className="login-title" style={{ fontSize: '36px' }}>Change Password</h1>

                    {message && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '12px',
                            borderRadius: '8px',
                            background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isSuccess ? '#059669' : '#DC2626',
                            border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            {message}
                        </div>
                    )}

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="form-group" style={{ marginBottom: '16px', width: '100%' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px', width: '100%' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px', width: '100%' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button type="submit" className="login-btn" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '600' }}>
                                <span>Update Password</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#4B5563', fontSize: '15px', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Cancel & Return
                            </button>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="login-btn"
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                Return to Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
