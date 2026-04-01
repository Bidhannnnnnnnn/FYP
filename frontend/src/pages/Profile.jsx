import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { validatePhone, validatePassword } from '../utils/validation';
import './Profile.css';
import { AlertTriangle, Building, Check, CheckCircle, FileText, Lock, Phone } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: '',
        email: '',
        role: '',
        phone_number: '',
        address: '',
        company_name: '',
        bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Change Password States
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', content: '' });

    // Password visibility toggles
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Password strength
    const pwdRules = [
        { label: '8+ characters',       test: (p) => p.length >= 8 },
        { label: 'Uppercase letter',     test: (p) => /[A-Z]/.test(p) },
        { label: 'Number',               test: (p) => /[0-9]/.test(p) },
        { label: 'Special character',    test: (p) => /[^A-Za-z0-9]/.test(p) },
    ];
    const pwdStrength = pwdRules.filter(r => r.test(newPassword)).length;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('user/profile/');
                setUser(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setMessage({ type: 'error', content: 'Failed to load profile data.' });
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (user.phone_number && !validatePhone(user.phone_number)) {
            setMessage({ type: 'error', content: 'Please enter a valid phone number (e.g., +977 98XXXXXXXX or 10 digits)' });
            return;
        }

        setSaving(true);
        try {
            const response = await api.put('user/profile/', {
                name: user.name,
                phone_number: user.phone_number,
                address: user.address,
                company_name: user.company_name,
                bio: user.bio
            });
            setUser(response.data);
            localStorage.setItem('name', response.data.name);
            setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
            setIsEditing(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', content: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', content: '' });

        if (!validatePassword(newPassword)) {
            setPasswordMessage({ type: 'error', content: 'Password must be 8+ characters, with an uppercase letter, number, and special character.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', content: 'New passwords do not match!' });
            return;
        }

        setChangingPassword(true);
        const token = localStorage.getItem('access_token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        try {
            await api.post('user/changepassword/', {
                old_password: oldPassword,
                password: newPassword,
                password2: confirmPassword
            }, config);

            setPasswordMessage({ type: 'success', content: 'Password changed successfully!' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Auto close form after 2 seconds
            setTimeout(() => {
                setShowPasswordForm(false);
                setPasswordMessage({ type: '', content: '' });
            }, 2000);

        } catch (error) {
            console.error('Change Password Failed:', error);
            let errorMsg = 'Failed to change password.';
            if (error.response?.data?.errors) {
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
                errorMsg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
            }
            errorMsg = errorMsg.replace(/["{}\\[\\]]/g, '').replace(/old_password:/g, '');
            setPasswordMessage({ type: 'error', content: errorMsg });
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div style={{ padding: '32px 40px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', width: '100%' }}>
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#10B981',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: '600',
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {toast.message}
                </div>
            )}

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Account Profile</h1>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6B7280' }}>Manage your professional identity and settings.</p>
                </div>

                {!isEditing && !showPasswordForm && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        style={{ padding: '10px 20px', background: '#667B68', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(102, 123, 104, 0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#586A5A'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#667B68'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Overview Card */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', padding: '32px', background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', borderRadius: '24px', marginBottom: '40px', border: '1px solid #E5E7EB' }}>
                <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)', color: 'white', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', border: '5px solid white', boxShadow: '0 12px 24px rgba(102, 123, 104, 0.2)', flexShrink: 0 }}>
                    {getInitials(user.name)}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>{user.name}</h2>
                        <span style={{ padding: '4px 12px', background: '#ECFDF5', color: '#059669', borderRadius: '100px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {user.role === 'business' ? 'Billboard Owner' : user.role === 'superadmin' ? 'Super Admin' : 'Advertiser'}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        {user.email}
                    </p>
                </div>
            </div>

            {message.content && (
                <div style={{ padding: '14px 18px', borderRadius: '14px', marginBottom: '32px', fontSize: '14px', fontWeight: '600', background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {message.type === 'error' ? '<AlertTriangle width={20} height={20} />️' : '<CheckCircle width={20} height={20} />'} {message.content}
                </div>
            )}

            {!isEditing ? (
                /* VIEW MODE */
                <div style={{ display: 'grid', gap: '40px', animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        {/* Company Section */}
                        <div style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Building width={20} height={20} /></div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Business Identity</h3>
                            </div>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Company / Agency</span>
                                    <span style={{ fontSize: '16px', color: '#1F2937', fontWeight: '600' }}>{user.company_name || 'Not Specified'}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Business Address</span>
                                    <span style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.6' }}>{user.address || 'No address provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Phone width={20} height={20} /></div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Personal Contact</h3>
                            </div>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Mobile Number</span>
                                    <span style={{ fontSize: '16px', color: '#1F2937', fontWeight: '600' }}>{user.phone_number || 'No phone linked'}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Legal Full Name</span>
                                    <span style={{ fontSize: '16px', color: '#1F2937', fontWeight: '600' }}>{user.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF7ED', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><FileText width={20} height={20} /></div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Professional Biography</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', color: '#4B5563', lineHeight: '1.8', whiteSpace: 'pre-line', maxWidth: '800px' }}>
                            {user.bio || "Craft a professional bio to introduce yourself to advertisers and partners. Let them know about your expertise in the billboard industry."}
                        </p>
                    </div>

                    {/* Security Toggle Section */}
                    <div style={{ marginTop: '20px', padding: '32px', borderRadius: '24px', background: showPasswordForm ? '#fff' : '#F9FAFB', border: '1.5px solid #F3F4F6', transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF2F2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}><Lock width={20} height={20} /></div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Security & Credentials</h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Keep your account protected with a strong password.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                style={{ padding: '10px 20px', background: showPasswordForm ? '#fff' : '#fff', color: '#4B5563', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                {showPasswordForm ? 'Close Settings' : 'Update Password'}
                            </button>
                        </div>

                        {showPasswordForm && (
                            <div style={{ marginTop: '32px', borderTop: '1px solid #F3F4F6', paddingTop: '32px', animation: 'fadeIn 0.3s ease-out' }}>
                                {passwordMessage.content && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', background: passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: passwordMessage.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                                        {passwordMessage.content}
                                    </div>
                                )}
                                <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                    {/* Current Password */}
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showOld ? 'text' : 'password'}
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                required
                                                placeholder="Enter your current password"
                                                style={{ width: '100%', padding: '12px 48px 12px 16px', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', letterSpacing: oldPassword ? '0.1em' : 'normal' }}
                                                onFocus={e => e.target.style.borderColor = '#667B68'}
                                                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                                            />
                                            <button type="button" onClick={() => setShowOld(!showOld)} tabIndex={-1}
                                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex', alignItems: 'center' }}>
                                                {showOld
                                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password with strength meter */}
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="Create a strong password"
                                                style={{ width: '100%', padding: '12px 48px 12px 16px', border: `1.5px solid ${newPassword ? (pwdStrength < 2 ? '#EF4444' : pwdStrength < 4 ? '#F59E0B' : '#10B981') : '#E5E7EB'}`, borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', letterSpacing: newPassword ? '0.1em' : 'normal', transition: 'border-color 0.2s' }}
                                                onFocus={e => e.target.style.borderColor = '#667B68'}
                                                onBlur={e => e.target.style.borderColor = newPassword ? (pwdStrength < 2 ? '#EF4444' : pwdStrength < 4 ? '#F59E0B' : '#10B981') : '#E5E7EB'}
                                            />
                                            <button type="button" onClick={() => setShowNew(!showNew)} tabIndex={-1}
                                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex', alignItems: 'center' }}>
                                                {showNew
                                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                }
                                            </button>
                                        </div>
                                        {/* Strength bar */}
                                        {newPassword && (
                                            <div style={{ marginTop: '10px' }}>
                                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                                    {[0, 1, 2, 3].map(i => (
                                                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i < pwdStrength ? (pwdStrength <= 1 ? '#EF4444' : pwdStrength <= 2 ? '#F59E0B' : pwdStrength <= 3 ? '#3B82F6' : '#10B981') : '#F3F4F6', transition: 'all 0.3s' }} />
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {pwdRules.map(rule => (
                                                        <span key={rule.label} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px', background: rule.test(newPassword) ? '#ECFDF5' : '#F9FAFB', color: rule.test(newPassword) ? '#059669' : '#9CA3AF', border: `1px solid ${rule.test(newPassword) ? '#D1FAE5' : '#F3F4F6'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {rule.test(newPassword) ? <Check width={16} height={16} /> : '○'} {rule.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Repeat your new password"
                                                style={{ width: '100%', padding: '12px 48px 12px 16px', border: `1.5px solid ${confirmPassword ? (confirmPassword === newPassword ? '#10B981' : '#EF4444') : '#E5E7EB'}`, borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', letterSpacing: confirmPassword ? '0.1em' : 'normal', transition: 'border-color 0.2s' }}
                                                onFocus={e => e.target.style.borderColor = '#667B68'}
                                                onBlur={e => e.target.style.borderColor = confirmPassword ? (confirmPassword === newPassword ? '#10B981' : '#EF4444') : '#E5E7EB'}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex', alignItems: 'center' }}>
                                                {showConfirm
                                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                }
                                            </button>
                                        </div>
                                        {confirmPassword && confirmPassword !== newPassword && (
                                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#EF4444', fontWeight: '600' }}><AlertTriangle width={20} height={20} /> Passwords do not match</p>
                                        )}
                                        {confirmPassword && confirmPassword === newPassword && (
                                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#10B981', fontWeight: '600' }}><Check width={16} height={16} /> Passwords match</p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={changingPassword || pwdStrength < 4 || confirmPassword !== newPassword} style={{ width: 'fit-content', padding: '12px 32px', background: (pwdStrength === 4 && confirmPassword === newPassword && !changingPassword) ? '#111827' : '#D1D5DB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: (pwdStrength === 4 && confirmPassword === newPassword && !changingPassword) ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}>
                                        {changingPassword ? 'Updating...' : 'Save New Password'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* EDIT MODE */
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={user.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                required
                                style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', color: '#111827', outline: 'none', transition: 'all 0.2s', background: '#fcfcfc' }}
                                onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.background = '#fff'; }}
                                onBlur={e => { e.target.style.borderColor = '#F3F4F6'; e.target.style.background = '#fcfcfc'; }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address (Primary)</label>
                            <input type="email" value={user.email} disabled style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                            <input
                                type="text"
                                name="phone_number"
                                value={user.phone_number || ''}
                                onChange={handleChange}
                                placeholder="+977 98XXXXXXXX"
                                style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', color: '#111827', outline: 'none', transition: 'all 0.2s', background: '#fcfcfc' }}
                                onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.background = '#fff'; }}
                                onBlur={e => { e.target.style.borderColor = '#F3F4F6'; e.target.style.background = '#fcfcfc'; }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company / Agency Name</label>
                            <input
                                type="text"
                                name="company_name"
                                value={user.company_name || ''}
                                onChange={handleChange}
                                placeholder="Agency Name"
                                style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', color: '#111827', outline: 'none', transition: 'all 0.2s', background: '#fcfcfc' }}
                                onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.background = '#fff'; }}
                                onBlur={e => { e.target.style.borderColor = '#F3F4F6'; e.target.style.background = '#fcfcfc'; }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Physical Business Address</label>
                        <textarea
                            name="address"
                            value={user.address || ''}
                            onChange={handleChange}
                            placeholder="Full office address..."
                            rows={2}
                            style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', color: '#111827', outline: 'none', transition: 'all 0.2s', background: '#fcfcfc', resize: 'vertical' }}
                            onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#F3F4F6'; e.target.style.background = '#fcfcfc'; }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Bio / About</label>
                        <textarea
                            name="bio"
                            value={user.bio || ''}
                            onChange={handleChange}
                            placeholder="Briefly describe your agency or advertising background..."
                            rows={5}
                            style={{ width: '100%', padding: '14px 18px', border: '2px solid #F3F4F6', borderRadius: '16px', fontSize: '16px', color: '#111827', outline: 'none', transition: 'all 0.2s', background: '#fcfcfc', resize: 'vertical' }}
                            onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#F3F4F6'; e.target.style.background = '#fcfcfc'; }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '32px', borderTop: '2px solid #F3F4F6' }}>
                        <button type="submit" disabled={saving} style={{ padding: '16px 48px', background: '#667B68', color: 'white', borderRadius: '18px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 8px 25px rgba(102, 123, 104, 0.4)' }} 
                            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = 'translateY(-3px)'; }} 
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            {saving ? 'Publishing Updates...' : 'Publish Profile Updates'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '16px 36px', background: 'white', color: '#4B5563', borderRadius: '18px', border: '2px solid #E5E7EB', fontWeight: '700', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            Discard Changes
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Profile;
