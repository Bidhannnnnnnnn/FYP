import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/BimbasetuLogo.png';
import api from '../services/api';
import heroImg from '../assets/landing/Durbarmarg.jpg';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import Toast from '../components/Toast';
import './AuthPage.css';
import { Building, Megaphone } from 'lucide-react';

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
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };
    const dismissToast = () => setToast({ show: false, message: '', type: 'success' });

    const handleLogin = async (e) => {
        e.preventDefault();
        // Clear stale token
        localStorage.removeItem('accessToken');
        try {
            const response = await api.post('user/login/', { email: loginEmail, password: loginPassword });
            localStorage.setItem('showLoginToast', 'true');
            localStorage.setItem('accessToken', response.data.token.access);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('name', response.data.name);

            if (response.data.is_active === false) {
                navigate('/banned');
            } else if (response.data.role === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            const detail = error.response?.data?.detail || '';
            const nonField = error.response?.data?.errors?.non_field_errors?.[0] || '';
            // Backend returns 401 with "inactive" detail for banned users
            if (detail.toLowerCase().includes('inactive') || nonField.toLowerCase().includes('inactive')) {
                // Store token if provided so Banned page can fetch appeal data
                if (error.response?.data?.token?.access) {
                    localStorage.setItem('accessToken', error.response.data.token.access);
                }
                navigate('/banned');
            } else {
                showToast('Login Failed: ' + (nonField || detail || 'Invalid credentials.'), 'error');
            }
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
            localStorage.setItem('showLoginToast', 'true');
            localStorage.setItem('accessToken', response.data.token.access);
            localStorage.setItem('role', response.data.role || 'business');
            localStorage.setItem('name', response.data.name || 'User');

            if (response.data.is_active === false) {
                navigate('/banned');
            } else if (response.data.role === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Google Login Failed:', error);
            if (error.response?.status === 404 && error.response?.data?.email) {
                // Switch to signup flow with pre-filled Google data
                setIsLogin(false);
                setSignupEmail(error.response.data.email);
                if (error.response.data.name) setName(error.response.data.name);
                setSignupStep(1);
                showToast('No account found. Your Google details have been pre-filled — complete registration below.', 'info');
            } else {
                showToast('Google Sign-In Failed: ' + (error.response?.data?.errors?.token?.[0] || 'Please try again.'), 'error');
            }
        }
    };

    const handleGoogleError = () => {
        showToast('Google Sign-In was cancelled or failed. Please try again.', 'error');
    };

    return (
        <React.Fragment>
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
                                        <button className="back-btn" onClick={() => setSignupStep(1)} title="Go back">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                        </button>
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
                                    {/* Role Selection Cards */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '12px', display: 'block' }}>What's your primary role?</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {/* Billboard Owner Card */}
                                            <div
                                                onClick={() => setRole('business')}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 14px',
                                                    borderRadius: '14px',
                                                    border: role === 'business' ? '2px solid var(--primary-green)' : '1.5px solid #E5E7EB',
                                                    background: role === 'business' ? 'rgba(102,123,104,0.07)' : '#F9FAFB',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.22s ease',
                                                    textAlign: 'center',
                                                    boxShadow: role === 'business' ? '0 0 0 4px rgba(102,123,104,0.12)' : 'none',
                                                }}
                                            >
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}><Building width={20} height={20} />️</div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: role === 'business' ? 'var(--primary-green)' : '#374151' }}>Billboard Owner</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: 1.4 }}>List & manage your billboard spaces</div>
                                            </div>
                                            {/* Advertiser Card */}
                                            <div
                                                onClick={() => setRole('advertiser')}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 14px',
                                                    borderRadius: '14px',
                                                    border: role === 'advertiser' ? '2px solid var(--primary-green)' : '1.5px solid #E5E7EB',
                                                    background: role === 'advertiser' ? 'rgba(102,123,104,0.07)' : '#F9FAFB',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.22s ease',
                                                    textAlign: 'center',
                                                    boxShadow: role === 'advertiser' ? '0 0 0 4px rgba(102,123,104,0.12)' : 'none',
                                                }}
                                            >
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}><Megaphone width={20} height={20} /></div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: role === 'advertiser' ? 'var(--primary-green)' : '#374151' }}>Advertiser / Agency</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: 1.4 }}>Book billboards for your campaigns</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms & Conditions */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: tc ? '1.5px solid var(--primary-green)' : '1.5px solid #E5E7EB', background: tc ? 'rgba(102,123,104,0.06)' : '#F9FAFB', marginBottom: '8px' }}>
                                        {/* Checkbox — only this toggles tc */}
                                        <div
                                            onClick={() => setTc(!tc)}
                                            style={{ width: '20px', height: '20px', borderRadius: '6px', border: tc ? '2px solid var(--primary-green)' : '2px solid #D1D5DB', background: tc ? 'var(--primary-green)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                        >
                                            {tc && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        {/* Text — not clickable for toggle */}
                                        <div style={{ userSelect: 'none' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                                I agree to the{' '}
                                                <span onClick={() => setShowTermsModal(true)} style={{ color: 'var(--primary-green)', textDecoration: 'underline', cursor: 'pointer' }}>
                                                    Terms & Conditions
                                                </span>
                                                {' '}and{' '}
                                                <span onClick={() => setShowTermsModal(true)} style={{ color: 'var(--primary-green)', textDecoration: 'underline', cursor: 'pointer' }}>
                                                    Privacy Policy
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Click the checkbox to confirm, or read the full terms first.</div>
                                        </div>
                                    </div>

                                    {/* Terms Modal */}
                                    {showTermsModal && (
                                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                                                {/* Modal header */}
                                                <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '800', color: '#111827' }}>Terms & Conditions</h3>
                                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>Bimbasetu Digital Signage Network · Last updated March 2026</p>
                                                    </div>
                                                    <button onClick={() => setShowTermsModal(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>
                                                {/* Scrollable content */}
                                                <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                                                    {[
                                                        { title: '1. Acceptance of Terms', body: 'By creating an account on Bimbasetu, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, you may not use the platform.' },
                                                        { title: '2. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. Each person may hold only one account.' },
                                                        { title: '3. Advertiser Responsibilities', body: 'Advertisers must only upload creatives they have the legal right to use. Content that is misleading, offensive, illegal, or violates third-party rights is strictly prohibited and may result in immediate account suspension.' },
                                                        { title: '4. Billboard Owner Responsibilities', body: 'Owners must only list billboards they own or have legal authority to advertise on. Listings must be accurate, with real photos and honest descriptions. Owners must review booking requests in a timely manner.' },
                                                        { title: '5. Payments & Billing', body: 'All prices are in Nepali Rupees (NRs.). Payments are processed upon booking confirmation. The price shown at checkout is final — there are no hidden fees. Refunds are not exercised.' },
                                                        { title: '6. Platform Moderation', body: 'Bimbasetu reserves the right to suspend or permanently remove accounts that violate these terms. Suspended users may submit an appeal, which will be reviewed and responded to in writing.' },
                                                        { title: '7. Privacy Policy', body: 'We collect only the information necessary to operate the platform (name, email, role, and transaction data). We do not sell your data to third parties. Your data is stored securely and used solely to provide and improve the Bimbasetu service.' },
                                                        { title: '8. Changes to Terms', body: 'Bimbasetu may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.' },
                                                    ].map(s => (
                                                        <div key={s.title} style={{ marginBottom: '20px' }}>
                                                            <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#111827', fontSize: '13px' }}>{s.title}</p>
                                                            <p style={{ margin: 0 }}>{s.body}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Modal footer */}
                                                <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => setShowTermsModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#F3F4F6', border: 'none', fontWeight: '600', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                                                        Close
                                                    </button>
                                                    <button
                                                        onClick={() => { setTc(true); setShowTermsModal(false); }}
                                                        style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'var(--primary-green)', border: 'none', fontWeight: '700', fontSize: '14px', color: '#fff', cursor: 'pointer' }}
                                                    >
                                                        I Agree & Continue
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {signupError && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', marginTop: '8px' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{signupError}</p>
                                        </div>
                                    )}

                                    <div className="step-nav">
                                        <button className="back-btn" onClick={() => setSignupStep(2)} title="Go back">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                        </button>
                                        <button
                                            className="login-btn"
                                            style={{ flex: 1 }}
                                            onClick={handleSignup}
                                            disabled={isSubmitting || !tc}
                                            title={!tc ? 'You must agree to the Terms & Conditions to continue' : ''}
                                        >
                                            {isSubmitting ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                                    </svg>
                                                    Registering...
                                                </span>
                                            ) : 'Create Account →'}
                                        </button>
                                    </div>
                                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={dismissToast} />
        </React.Fragment>
    );
};

export default AuthPage;
