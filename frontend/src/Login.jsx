import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './services/api'; // Import the axios instance

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('user/login/', { email, password });
            console.log('Login Success:', response.data);
            alert('Login Successful! Token: ' + response.data.token.access);
        } catch (error) {
            console.error('Login Failed:', error);
            alert('Login Failed: ' + (error.response?.data?.errors?.non_field_errors?.[0] || 'Unknown error'));
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                    <div className="signup-link-container">
                        <Link to="/signup" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>Sign Up</span>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 1L17 9L9 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M1 9H17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    </div>
                </div>

                <div className="login-section">
                    <h1 className="login-title">Sign In</h1>

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Email or Username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>

                        <button type="submit" className="login-btn">
                            <span>Sign In</span>
                            <div className="btn-icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 4L21 11L14 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3 11H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
