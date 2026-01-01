import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }


        const token = localStorage.getItem('access_token'); // Assuming standard storage
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        try {
            await api.post('user/changepassword/', { password, password2: confirmPassword }, config);
            setMessage('Password change successful!');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Change Password Failed:', error);
            let errorMsg = 'Failed to change password.';
            if (error.response?.data?.errors) {
                errorMsg = JSON.stringify(error.response.data.errors);
            } else if (error.response?.data) {
                errorMsg = JSON.stringify(error.response.data);
            }
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

                    {message && <p style={{ color: message.includes('Failed') || message.includes('match') ? 'red' : 'green', textAlign: 'center' }}>{message}</p>}

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

                        <button type="submit" className="login-btn" style={{ width: '250px' }}>
                            <span>Update Password</span>
                        </button>

                        <Link to="/login" style={{ marginTop: '20px', color: 'black', textDecoration: 'none' }}>Back to Home</Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
