import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/BimbasetuLogo.png';
import api from '../services/api';
import heroImg from '../assets/landing/Durbarmarg.jpg';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (location.pathname === '/signup') {
            setIsLogin(false);
        } else if (location.pathname === '/login') {
            setIsLogin(true);
        }
    }, [location.pathname]);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup State
    const [name, setName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tc, setTc] = useState(false);
    const [role, setRole] = useState('business');
    const [signupStep, setSignupStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameError, setNameError] = useState('');

    // Password Visibility State (Login only)
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        // Clear stale token
        localStorage.removeItem('accessToken');
        try {
            const response = await api.post('user/login/', { email: loginEmail, password: loginPassword });
            console.log('Login Success:', response.data);
            localStorage.setItem('showLoginToast', 'true');
            localStorage.setItem('accessToken', response.data.token.access);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('name', response.data.name);

            if (response.data.role === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login Failed:', error);
            alert('Login Failed: ' + (error.response?.data?.errors?.non_field_errors?.[0] || 'Unknown error'));
        }
    };

    const handleSignup = async (e) => {
        if (e) e.preventDefault();
        
        if (signupPassword !== confirmPassword) {
            setSignupError('Passwords do not match');
            return;
        }

        if (!tc) {
            setSignupError('Please agree to the Terms & Conditions');
            return;
        }

        setIsSubmitting(true);
        setSignupError('');

        try {
            const formData = {
                email: signupEmail,
                name: name,
                password: signupPassword,
                password2: confirmPassword,
                tc: tc,
                role: role
            };

            const response = await api.post('user/register/', formData);
            console.log('Registration Success:', response.data);
            setSignupStep(4); // Move to success/verify step
        } catch (error) {
            console.error('Registration Failed:', error);
            const errorMsg = error.response?.data?.errors?.non_field_errors?.[0] || 
                             error.response?.data?.email?.[0] ||
                             error.response?.data?.password?.[0] ||
                             'Registration failed. Please try again.';
            setSignupError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        // Clear stale token
        localStorage.removeItem('accessToken');
        try {
            const response = await api.post('user/google/', { access_token: credentialResponse.credential });
            console.log('Google Login Success:', response.data);
            alert('Google Login Successful!');
            localStorage.setItem('accessToken', response.data.token.access);
            localStorage.setItem('role', response.data.role || 'business'); // Default to business if no role returned
            localStorage.setItem('name', response.data.name || 'User');

            if (response.data.role === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
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
            <div className="auth-container">
                {/* Left Side - Visual */}
                <div className="auth-visual" style={{ backgroundImage: `url(${heroImg})` }}>
                    <div className="visual-logo">
                        <img src={logoImg} alt="Bimbasetu Logo" className="visual-logo-img" />
                    </div>
                    <div className="visual-content">
                        <h1>Bimbasetu.</h1>
                        <p>Revolutionizing high-impact billboard advertising across the nation.</p>
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
                                        placeholder="••••••••"
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
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                        {signupStep < 4 && (
                            <div className="form-header">
                                <h2>Create Account</h2>
                                <p>Join Bimbasetu today • Step {signupStep} of 3</p>
                                <div className="step-indicator">
                                    <div className={`step-dot ${signupStep >= 1 ? 'active' : ''}`}></div>
                                    <div className={`step-dot ${signupStep >= 2 ? 'active' : ''}`}></div>
                                    <div className={`step-dot ${signupStep >= 3 ? 'active' : ''}`}></div>
                                </div>
                            </div>
                        )}

                        {signupStep === 1 && (
                            <div className="step-container fade-in">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. John Doe"
                                        value={name}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setName(v);
                                            if (v && !validateName(v)) setNameError('Valid name required (letters/spaces)');
                                            else setNameError('');
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && validateName(name) && validateEmail(signupEmail)) {
                                                setSignupStep(2);
                                            }
                                        }}
                                        autoFocus
                                    />
                                    {nameError && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{nameError}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="name@company.com"
                                        value={signupEmail}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSignupEmail(v);
                                            if (v && !validateEmail(v)) setEmailError('Valid email format required');
                                            else setEmailError('');
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && validateName(name) && validateEmail(signupEmail)) {
                                                setSignupStep(2);
                                            }
                                        }}
                                    />
                                    {emailError && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{emailError}</p>}
                                </div>
                                <button 
                                    className="login-btn full-width" 
                                    onClick={() => setSignupStep(2)}
                                    disabled={!name || !signupEmail || !validateName(name) || !validateEmail(signupEmail)}
                                    title={(!name || !signupEmail || !validateName(name) || !validateEmail(signupEmail)) ? 'Please correctly fill out all fields above' : ''}
                                >
                                    Continue to Password
                                </button>
                            </div>
                        )}

                        {signupStep === 2 && (
                            <div className="step-container fade-in">
                                <div className="form-group">
                                    <label>Create Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showSignupPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Minimum 8 characters"
                                            value={signupPassword}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setSignupPassword(v);
                                                if (v && !validatePassword(v)) setPasswordError('Password must be 8+ chars (upper, number, symbol)');
                                                else if (confirmPassword && v !== confirmPassword) setPasswordError('Passwords do not match');
                                                else setPasswordError('');
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && validatePassword(signupPassword) && signupPassword === confirmPassword) {
                                                    setSignupStep(3);
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                        >
                                            {showSignupPassword ? (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Repeat your password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setConfirmPassword(v);
                                                if (signupPassword && v !== signupPassword) setPasswordError('Passwords do not match');
                                                else if (!validatePassword(signupPassword)) setPasswordError('Password must be 8+ chars (upper, number, symbol)');
                                                else setPasswordError('');
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && validatePassword(signupPassword) && signupPassword === confirmPassword) {
                                                    setSignupStep(3);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7.03 20 2.73 16.29 1 12C2 9.5 3.8 7.37 6.06 6.06L17.94 17.94ZM9.9 4.24A9.97 9.97 0 0 1 12 4C16.97 4 21.27 7.71 23 12C22 14.5 20.2 16.63 17.94 17.94L9.9 4.24ZM1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {passwordError && <p style={{ fontSize: '12px', color: '#EF4444', margin: '8px 0 0' }}>{passwordError}</p>}
                                </div>
                                <div className="step-nav">
                                    <button className="back-btn" onClick={() => setSignupStep(1)}>Back</button>
                                    <button 
                                        className="login-btn" 
                                        style={{ flex: 1 }}
                                        onClick={() => setSignupStep(3)}
                                        disabled={!signupPassword || !confirmPassword || !validatePassword(signupPassword) || signupPassword !== confirmPassword}
                                        title={(!signupPassword || !confirmPassword || !validatePassword(signupPassword) || signupPassword !== confirmPassword) ? 'Password must be fully matching criteria above' : ''}
                                    >
                                        Continue to Role
                                    </button>
                                </div>
                            </div>
                        )}

                        {signupStep === 3 && (
                            <div className="step-container fade-in">
                                <div className="form-group">
                                    <label>What's your primary role?</label>
                                    <select
                                        className="form-control"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="business">Billboard Owner</option>
                                        <option value="advertiser">Advertiser/Agency</option>
                                    </select>
                                </div>
                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="tc-auth"
                                        checked={tc}
                                        onChange={(e) => setTc(e.target.checked)}
                                    />
                                    <label htmlFor="tc-auth">I agree to the Terms & Conditions</label>
                                </div>
                                {signupError && <p className="error-text">{signupError}</p>}
                                <div className="step-nav">
                                    <button className="back-btn" onClick={() => setSignupStep(2)}>Back</button>
                                    <button 
                                        className="login-btn" 
                                        style={{ flex: 1 }}
                                        onClick={handleSignup}
                                        disabled={isSubmitting || !tc}
                                    >
                                        {isSubmitting ? 'Registering...' : 'Confirm Signup'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {signupStep === 4 && (
                            <div className="success-step fade-in">
                                <div className="success-icon">
                                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="var(--primary-green)" strokeWidth="2" />
                                        <path d="M8 12L11 15L16 9" stroke="var(--primary-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h2>Registration Successful</h2>
                                <p>Thank you for joining Bimbasetu!</p>
                                <p>Please check your email to verify your account before signing in.</p>
                                <button 
                                    className="login-btn full-width" 
                                    onClick={() => {
                                        setIsLogin(true);
                                        setSignupStep(1);
                                    }}
                                    style={{ marginTop: '25px' }}
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        )}

                        {!isSubmitting && signupStep < 4 && (
                            <div className="form-footer">
                                <p>Already have an account? <span onClick={() => {
                                    setIsLogin(true);
                                    setSignupStep(1);
                                }} className="toggle-link">Sign In</span></p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;
