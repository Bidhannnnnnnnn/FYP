import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: '',
        email: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Change Password States
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', content: '' });

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
        setSaving(true);
        setMessage({ type: '', content: '' });
        try {
            const response = await api.put('user/profile/', { name: user.name });
            setUser(response.data);
            localStorage.setItem('name', response.data.name);
            setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
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
        <div style={{ padding: '30px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', width: '100%', maxWidth: '800px' }}>
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

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>Manage Profile</h1>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6B7280' }}>Update your account details and settings.</p>
                </div>

                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', color: '#059669', fontWeight: '600', fontSize: '14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                    Account Active
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', background: '#F9FAFB', borderRadius: '16px', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', border: '4px solid white', boxShadow: '0 8px 16px rgba(102, 123, 104, 0.2)' }}>
                    {getInitials(user.name)}
                </div>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#1F2937' }}>{user.name}</h2>
                    <span style={{ fontSize: '14px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {user.role === 'business' ? 'Billboard Owner' : user.role === 'superadmin' ? 'Super Admin' : 'Advertiser'}
                    </span>
                </div>
            </div>

            {message.content && !showPasswordForm && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                    {message.content}
                </div>
            )}

            {!showPasswordForm ? (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={user.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '15px', color: '#1F2937', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '15px', background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                        <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: '#667B68', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(102, 123, 104, 0.2)' }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setShowPasswordForm(true)} style={{ padding: '12px 24px', background: 'white', color: '#4B5563', borderRadius: '10px', border: '1px solid #D1D5DB', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.target.style.background = '#F9FAFB'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                            Change Password
                        </button>
                    </div>
                </form>
            ) : (
                <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1F2937' }}>Update Security Credentials</h3>

                    {passwordMessage.content && (
                        <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', background: passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: passwordMessage.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                            {passwordMessage.content}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>Current Password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                placeholder="Enter current password"
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm new password"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" disabled={changingPassword} style={{ padding: '10px 20px', background: '#10B981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                                {changingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                            <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordMessage({ type: '', content: '' }); }} disabled={changingPassword} style={{ padding: '10px 20px', background: 'transparent', color: '#4B5563', borderRadius: '8px', border: '1px solid #D1D5DB', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Profile;
