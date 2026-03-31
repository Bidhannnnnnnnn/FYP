import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Banned = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [appeals, setAppeals] = useState([]);
    const [appealText, setAppealText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch appeals history AND profile via the appeal endpoint
                const appealsRes = await api.get('user/appeal/');
                setProfile(appealsRes.data.profile);
                setAppeals(appealsRes.data.appeals);
                
                if (appealsRes.data.profile.is_active) {
                    navigate('/dashboard');
                    return;
                }
            } catch (err) {
                console.error("Error fetching data", err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const submitAppeal = async (e) => {
        e.preventDefault();
        if (!appealText.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            const res = await api.post('user/appeal/', { appeal_text: appealText });
            // Prepend new appeal to the list
            setAppeals([res.data, ...appeals]);
            setAppealText('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit appeal. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F9FAFB' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#DC2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const hasPendingAppeal = appeals.some(a => a.status === 'pending');

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#F3F4F6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: '650px',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                overflow: 'hidden'
            }}>
                {/* Header Area */}
                <div style={{ background: '#FEF2F2', padding: '30px', textAlign: 'center', borderBottom: '1px solid #FEE2E2' }}>
                    <div style={{ 
                        width: '64px', height: '64px', background: '#FEE2E2', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        color: '#DC2626'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#991B1B' }}>Account Suspended</h1>
                    <p style={{ margin: 0, color: '#DC2626', fontSize: '15px', fontWeight: '500' }}>
                        Your Bimbasetu account "{profile?.email}" has been temporarily suspended.
                    </p>
                </div>

                {/* Content Body */}
                <div style={{ padding: '30px' }}>
                    
                    {/* Ban Reason Box */}
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>
                            Reason for Suspension
                        </div>
                        <div style={{ fontSize: '15px', color: '#374151', lineHeight: '1.5' }}>
                            {profile?.ban_reason || 'Violation of Terms of Service. Please contact support for more details.'}
                        </div>
                    </div>

                    {/* Appeals Section */}
                    {appeals.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                                Appeal History
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {appeals.map((appeal) => (
                                    <div key={appeal.id} style={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid #E5E7EB',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ 
                                            padding: '12px 16px', 
                                            background: '#F9FAFB', 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid #E5E7EB'
                                        }}>
                                            <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                                {new Date(appeal.created_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ 
                                                fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px',
                                                background: appeal.status === 'pending' ? '#FEF3C7' : (appeal.status === 'approved' ? '#D1FAE5' : '#FEE2E2'),
                                                color: appeal.status === 'pending' ? '#D97706' : (appeal.status === 'approved' ? '#059669' : '#DC2626')
                                            }}>
                                                {appeal.status === 'pending' ? 'Under Review' : (appeal.status === 'approved' ? 'Approved' : 'Rejected')}
                                            </span>
                                        </div>
                                        <div style={{ padding: '16px', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                                            <div style={{ marginBottom: appeal.admin_response ? '12px' : 0 }}>
                                                <strong style={{ color: '#111827', display: 'block', marginBottom: '4px' }}>Your Message:</strong>
                                                {appeal.appeal_text}
                                            </div>
                                            
                                            {appeal.admin_response && (
                                                <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #6B7280' }}>
                                                    <strong style={{ color: '#111827', display: 'block', marginBottom: '4px' }}>Admin Response:</strong>
                                                    {appeal.admin_response}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Appeal Form */}
                    <div style={{ borderTop: appeals.length > 0 ? 'none' : '1px solid #E5E7EB', paddingTop: appeals.length > 0 ? 0 : '8px' }}>
                        {hasPendingAppeal ? (
                            <div style={{ background: '#FFFBEB', border: '1px dashed #F59E0B', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ margin: 0, color: '#B45309', fontWeight: '500', fontSize: '14px' }}>
                                    You have a pending appeal under review. Please wait for an Admin to respond before submitting another one.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={submitAppeal}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                        Submit an Appeal
                                    </label>
                                    <textarea
                                        rows="4"
                                        placeholder="Explain why you believe your account should be reinstated..."
                                        value={appealText}
                                        onChange={(e) => setAppealText(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px',
                                            border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: 'inherit',
                                            resize: 'vertical', outline: 'none', transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10B981'}
                                        onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                                        required
                                    />
                                </div>
                                
                                {error && (
                                    <div style={{ color: '#DC2626', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        onClick={handleLogout}
                                        style={{ 
                                            flex: 1, padding: '12px', borderRadius: '8px', background: '#F3F4F6', 
                                            color: '#374151', border: '1px solid #D1D5DB', fontWeight: '600',
                                            cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#E5E7EB'}
                                        onMouseLeave={(e) => e.target.style.background = '#F3F4F6'}
                                    >
                                        Log Out
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting || !appealText.trim()}
                                        style={{ 
                                            flex: 2, padding: '12px', borderRadius: '8px', background: '#10B981', 
                                            color: 'white', border: 'none', fontWeight: '600',
                                            cursor: (submitting || !appealText.trim()) ? 'not-allowed' : 'pointer', 
                                            opacity: (submitting || !appealText.trim()) ? 0.7 : 1,
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {submitting ? 'Submitting...' : 'Send Appeal'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default Banned;
