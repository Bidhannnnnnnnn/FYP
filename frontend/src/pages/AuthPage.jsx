import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup State
    const [name, setName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [role, setRole] = useState('business');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tc, setTc] = useState(false);

    // Password Visibility State
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('user/login/', { email: loginEmail, password: loginPassword });
            console.log('Login Success:', response.data);
            alert('Login Successful! Token: ' + response.data.token.access);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login Failed:', error);
            alert('Login Failed: ' + (error.response?.data?.errors?.non_field_errors?.[0] || 'Unknown error'));
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (signupPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const response = await api.post('user/register/', {
                name,
                email: signupEmail,
                role,
                password: signupPassword,
                password2: confirmPassword,
                tc
            });
            console.log('Registration Success:', response.data);
            alert('Registration Successful! Please Login.');
            setIsLogin(true); // Switch to login view
        } catch (error) {
            console.error('Registration Failed:', error);
            let errorMsg = 'Unknown error';
            if (error.response?.data?.errors) {
                errorMsg = JSON.stringify(error.response.data.errors);
            } else if (error.response?.data) {
                errorMsg = JSON.stringify(error.response.data);
            }
            alert('Registration Failed: ' + errorMsg);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post('user/google/', { access_token: credentialResponse.credential });
            console.log('Google Login Success:', response.data);
            alert('Google Login Successful!');
            // Save token logic here if implementing auth context
            navigate('/dashboard');
            // Store token or navigate
        } catch (error) {
            console.error('Google Login Failed:', error);
            alert('Google Login Failed.');
        }
    };

    const handleGoogleError = () => {
        alert('Google Login Failed');
    };

    return (
        <div className="auth-page">
            <div className={`auth-container ${!isLogin ? 'active' : ''}`}>

                {/* Visual Section (Text) */}
                <div className="auth-visual">
                    <div className="visual-content">
                        <h1>Manage with<br />Confidence.</h1>
                        <p>Streamline your billboard operations with Bimbasetu's comprehensive management features.</p>
                        <div className="visual-decoration"></div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="auth-forms">

                    {/* Login Form */}
                    <div className={`form-wrapper login-wrapper ${isLogin ? 'visible' : 'hidden'}`}>
                        <div className="form-header">
                            <h2>Sign In</h2>
                            <p>Access your dashboard</p>
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showLoginPassword ? "text" : "password"}
                                        className="form-control"
                                        placeholder="Enter your password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    >
                                        {showLoginPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="login-btn full-width">Sign In</button>

                            <div className="divider">
                                <span>OR</span>
                            </div>

                            <div className="google-btn-container">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_blue"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </form>
                        <div className="form-footer">
                            <p>Don't have an account? <span onClick={() => setIsLogin(false)} className="toggle-link">Sign Up</span></p>
                            <Link to="/forgot-password" style={{ textDecoration: 'none' }}><p className="forgot-link">Forgot Password?</p></Link>
                        </div>
                    </div>

                    {/* Signup Form */}
                    <div className={`form-wrapper signup-wrapper ${!isLogin ? 'visible' : 'hidden'}`}>
                        <div className="form-header">
                            <h2>Create Account</h2>
                            <p>Join Bimbasetu today</p>
                        </div>
                        <form onSubmit={handleSignup} className="signup-scroll">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="john@example.com"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
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
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showSignupPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="******"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                        >
                                            {showSignupPassword ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group half">
                                    <label>Confirm</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="******"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="tc-new"
                                    checked={tc}
                                    onChange={(e) => setTc(e.target.checked)}
                                    required
                                />
                                <label htmlFor="tc-new">I agree to Terms & Conditions</label>
                            </div>
                            <button type="submit" className="login-btn full-width">Register</button>

                            <div className="divider">
                                <span>OR</span>
                            </div>

                            <div className="google-btn-container">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    text="signup_with"
                                    theme="filled_blue"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </form>
                        <div className="form-footer">
                            <p>Already have an account? <span onClick={() => setIsLogin(true)} className="toggle-link">Sign In</span></p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;
