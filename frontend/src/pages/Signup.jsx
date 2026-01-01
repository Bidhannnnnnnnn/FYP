import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './services/api';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('business');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tc, setTc] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const response = await api.post('user/register/', {
                name,
                email,
                role,
                password,
                password2: confirmPassword,
                tc
            });
            console.log('Registration Success:', response.data);
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (error) {
            console.error('Registration Failed:', error);
            // Improve error display for object errors
            let errorMsg = 'Unknown error';
            if (error.response?.data?.errors) {
                errorMsg = JSON.stringify(error.response.data.errors);
            } else if (error.response?.data) {
                errorMsg = JSON.stringify(error.response.data);
            }
            alert('Registration Failed: ' + errorMsg);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                    <div className="signup-link-container">
                        <Link to="/login" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>Sign In</span>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 1L17 9L9 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M1 9H17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    </div>
                </div>

                <div className="login-section">
                    <h1 className="login-title">Sign Up</h1>

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

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

                        <div className="form-group">
                            <select
                                className="form-control"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="business">Billboard Owner</option>
                                <option value="advertiser">Advertiser</option>
                            </select>
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

                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="tc"
                                checked={tc}
                                onChange={(e) => setTc(e.target.checked)}
                                required
                                style={{ width: '20px', height: '20px' }}
                            />
                            <label htmlFor="tc">I agree to Terms and Conditions</label>
                        </div>

                        <button type="submit" className="login-btn" style={{ marginTop: '20px' }}>
                            <span>Register</span>
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

export default Signup;
