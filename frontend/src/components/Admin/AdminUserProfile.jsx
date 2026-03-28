import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Admin.css';

const AdminUserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [billboards, setBillboards] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch basic user profile
                const userRes = await api.get(`user/user-manage/${id}/`);
                const userData = userRes.data;
                setUser(userData);

                // Fetch associated entity data based on role
                if (userData.role === 'business') {
                    const bbRes = await api.get('billboards/my/');
                    // superadmin gets all billboards. Filter by owner
                    setBillboards(bbRes.data.filter(b => b.owner?.id === userData.id || b.owner?.email === userData.email));
                } else if (userData.role === 'user') {
                    const bkRes = await api.get('campaigns/owner-bookings/');
                    // superadmin gets all bookings. Filter by advertiser account
                    setBookings(bkRes.data.filter(b => b.campaign?.advertiser === userData.id || b.advertiser_id === userData.id));
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch user data", err);
                setError("Could not load user profile.");
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    if (loading) return <div>Loading Profile...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!user) return null;

    return (
        <div style={{ padding: '32px 40px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', width: '100%', boxSizing: 'border-box' }}>
            <button
                onClick={() => navigate('/admin/users')}
                style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#667B68', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}
            >
                ← Back to Users
            </button>

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>User Profile: {user.name}</h1>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6B7280' }}>Reviewing identity and platform activity.</p>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', padding: '32px', background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', borderRadius: '24px', marginBottom: '40px', border: '1px solid #E5E7EB' }}>
                <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)', color: 'white', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', border: '5px solid white', boxShadow: '0 12px 24px rgba(102, 123, 104, 0.2)', flexShrink: 0 }}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
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

            <div style={{ display: 'grid', gap: '40px', animation: 'fadeIn 0.4s ease-out', marginBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '32px' }}>
                    {/* Company Section */}
                    <div style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏢</div>
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
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📞</div>
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
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF7ED', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📝</div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Professional Biography</h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '16px', color: '#4B5563', lineHeight: '1.8', whiteSpace: 'pre-line', maxWidth: '800px' }}>
                        {user.bio || "No professional biography provided."}
                    </p>
                </div>
            </div>

            {user.role === 'business' && (
                <div style={{ marginTop: '40px', padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🖼️</div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Associated Billboards</h3>
                    </div>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billboards.length > 0 ? (
                                    billboards.map(b => (
                                        <tr key={b.id}>
                                            <td>{b.title}</td>
                                            <td>{b.location}</td>
                                            <td>
                                                <span className={`status-badge status-${b.status}`}>
                                                    {b.status === 'pending' ? 'Pending' : b.status === 'approved' ? 'Approved' : 'Rejected'}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => navigate(`/admin/billboard/${b.id}`)} className="action-btn" style={{ background: '#F3F4F6', color: '#374151' }}>View</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No billboards found for this owner.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {user.role === 'user' && (
                <div style={{ marginTop: '40px', padding: '32px', background: '#fff', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Campaign Bookings</h3>
                    </div>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Campaign</th>
                                    <th>Billboard</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length > 0 ? (
                                    bookings.map(b => (
                                        <tr key={b.id}>
                                            <td>#{b.id}</td>
                                            <td>{b.campaign?.name || 'N/A'}</td>
                                            <td>{b.billboard_name || `ID: ${b.billboard}`}</td>
                                            <td>
                                                <span className={`status-badge status-${b.booking_status}`}>
                                                    {b.booking_status === 'pending' ? 'Pending' : b.booking_status === 'approved' ? 'Approved' : b.booking_status === 'paid' ? 'Paid' : 'Other'}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => navigate(`/admin/booking/${b.id}`)} className="action-btn" style={{ background: '#F3F4F6', color: '#374151' }}>View</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No booking history found for this advertiser.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserProfile;
