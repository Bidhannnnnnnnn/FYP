import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { validatePassword } from '../utils/validation';
import Toast from '../components/Toast';
import './AuthPage.css';
import { Check } from 'lucide-react';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Steps: 1 = Email Input, 2 = Verify OTP, 3 = New Password
    const [step, setStep] = useState(location.state?.email ? 2 : 1);
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Loading states for buttons
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    // Toast notifications
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };
    const dismissToast = () => setToast({ show: false, message: '', type: 'success' });

    // Timer logic for OTP
    const [timer, setTimer] = useState(119); // 1:59 in seconds
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = () => {
        const m = Math.floor(timer / 60);
        const s = timer % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next box
        if (value !== '' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        // Move back on backspace if current box is empty
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6).split('');
        if (pastedData.length === 0) return;

        const newOtp = [...otp];
        pastedData.forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);

        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs[focusIndex].current.focus();
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        
        // Prevent multiple submissions
        if (isSendingOTP) return;
        
        setIsSendingOTP(true);
        try {
            await api.post('user/SendPasswordResetEmail/', { email });
            setStep(2);
            setTimer(119);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            if (inputRefs[0]?.current) {
                setTimeout(() => inputRefs[0].current.focus(), 100);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to send OTP. Please check your email and try again.', 'error');
        } finally {
            setIsSendingOTP(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const finalOtp = otp.join('');
        if (finalOtp.length !== 6) return;
        
        // Prevent multiple submissions
        if (isVerifyingOTP) return;
        
        setIsVerifyingOTP(true);
        try {
            await api.post('user/verify-otp/', { email, otp: finalOtp });
            setStep(3); // OTP Verified, move to password reset
        } catch (error) {
            console.error(error);
            showToast('OTP Verification Failed. Please check the code and try again.', 'error');
        } finally {
            setIsVerifyingOTP(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const finalOtp = otp.join('');
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }
        
        // Prevent multiple submissions
        if (isResettingPassword) return;
        
        setIsResettingPassword(true);
        try {
            await api.post(`user/reset-password/`, { email, otp: finalOtp, password, password2: confirmPassword });
            showToast('Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            console.error('Password Reset Failed:', error);
            showToast('Failed to reset password. OTP may have expired.', 'error');
            setIsResettingPassword(false);
        }
    };

    return (
        <React.Fragment>
        <div className="login-page">
            <div className="login-card" style={{ height: 'auto', minHeight: '500px' }}>
                <div className="header">
                    <h2 className="brand-name">Bimbasetu</h2>
                </div>

                <div className="login-section">
                    <h1 className="login-title" style={{ fontSize: '36px' }}>Reset Password</h1>

                    {/* Step 1: Send OTP to Email */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '30px', textAlign: 'center' }}>Enter your email to receive a 6-digit verification code.</p>
                            <div className="form-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="login-btn full-width" disabled={!email || isSendingOTP}>
                                {isSendingOTP ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Sending OTP...
                                    </span>
                                ) : (
                                    <span>Send OTP Code</span>
                                )}
                            </button>
                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                            <button type="button" onClick={() => navigate('/login')} style={{ background:'none', border:'none', color:'#4B5563', marginTop: '15px', cursor:'pointer' }}>Back to Login</button>
                        </form>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '10px', textAlign: 'center' }}>We've sent a 6-digit code to <strong>{email}</strong>.</p>
                            
                            <div className="form-group" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }} onPaste={handleOtpPaste}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            style={{ 
                                                width: '55px', 
                                                height: '65px', 
                                                fontSize: '24px', 
                                                textAlign: 'center', 
                                                border: '1px solid #ccc', 
                                                borderRadius: '8px',
                                                outline: 'none',
                                                transition: 'all 0.2s',
                                                boxShadow: digit ? '0 0 0 2px #3B82F6' : 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                                            onBlur={(e) => e.target.style.borderColor = '#ccc'}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="login-btn full-width" disabled={otp.join('').length !== 6 || isVerifyingOTP}>
                                {isVerifyingOTP ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    <span>Verify OTP</span>
                                )}
                            </button>

                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                {canResend ? (
                                    <button 
                                        type="button" 
                                        onClick={handleSendOTP} 
                                        disabled={isSendingOTP}
                                        style={{ 
                                            background:'none', 
                                            border:'none', 
                                            color: isSendingOTP ? '#9CA3AF' : '#2563EB', 
                                            cursor: isSendingOTP ? 'not-allowed' : 'pointer', 
                                            fontWeight:'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {isSendingOTP && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                        )}
                                        {isSendingOTP ? 'Sending...' : 'Resend OTP'}
                                    </button>
                                ) : (
                                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Resend code in <span style={{ fontWeight:'bold', color: '#374151' }}>{formatTime()}</span></p>
                                )}
                                
                                <button type="button" onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', textDecoration: 'underline' }}>Change Email Address</button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Setup New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '20px', textAlign: 'center', color: '#10B981', fontWeight: 'bold' }}><Check width={16} height={16} /> OTP Verified</p>
                            <p style={{ marginBottom: '20px', textAlign: 'center' }}>Please set your new password below.</p>

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
                                disabled={!password || !confirmPassword || !validatePassword(password) || password !== confirmPassword || isResettingPassword}
                                title={(!password || !confirmPassword || !validatePassword(password) || password !== confirmPassword) ? 'Please resolve the password errors above' : ''}
                            >
                                {isResettingPassword ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Resetting Password...
                                    </span>
                                ) : (
                                    <span>Reset Password</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={dismissToast} />
        </React.Fragment>
    );
};

export default ResetPassword;
