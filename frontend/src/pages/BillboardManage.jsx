import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css';
import { RefreshCw } from 'lucide-react';

const BillboardManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [billboard, setBillboard] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Search & Filter State for Schedule Section
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');

    useEffect(() => {
        fetchBillboardData();
        fetchHistory();
    }, [id]);

    const fetchHistory = async () => {
        try {
            const res = await api.get(`billboards/history/${id}/`);
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchBillboardData = async () => {
        if (!id) return;
        try {
            const [bbRes, bookingsRes] = await Promise.all([
                api.get(`billboards/detail/${id}/`),
                api.get('campaigns/owner-bookings/')
            ]);
            setBillboard(bbRes.data);
            const thisBillboardBookings = bookingsRes.data.filter(b => b.billboard === parseInt(id));
            setBookings(thisBillboardBookings);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching billboard data", error);
            navigate(-1);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this billboard? This action cannot be undone.")) return;
        try {
            await api.delete(`billboards/delete/${id}/`);
            navigate(-1);
        } catch (error) {
            alert("Failed to delete billboard.");
        }
    };


    // Derived Stats
    const activeBookings = useMemo(() => bookings.filter(b => ['approved', 'active', 'paid'].includes(b.booking_status)), [bookings]);
    const pendingBookings = useMemo(() => bookings.filter(b => b.booking_status === 'pending'), [bookings]);
    const totalRevenue = useMemo(() => activeBookings.reduce((sum, b) => sum + parseFloat(b.price_calculated || 0), 0), [activeBookings]);

    // Processed Bookings (All Bookings with search/filter/sort)
    const processedBookings = useMemo(() => {
        let result = [...bookings];

        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            result = result.filter(b =>
                (b.id && b.id.toString().includes(q)) ||
                (b.campaign_name && b.campaign_name.toLowerCase().includes(q)) ||
                (b.advertiser_email && b.advertiser_email.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== 'All') {
            result = result.filter(b => {
                const norm = b.booking_status.replace('_', ' ').toLowerCase();
                return norm === statusFilter.toLowerCase();
            });
        }

        result.sort((a, b) => {
            if (sortBy === 'Newest') return new Date(b.start_date) - new Date(a.start_date);
            if (sortBy === 'Oldest') return new Date(a.start_date) - new Date(b.start_date);
            if (sortBy === 'AmountHigh') return parseFloat(b.price_calculated || 0) - parseFloat(a.price_calculated || 0);
            if (sortBy === 'AmountLow') return parseFloat(a.price_calculated || 0) - parseFloat(b.price_calculated || 0);
            return 0;
        });

        return result;
    }, [bookings, searchTerm, statusFilter, sortBy]);

    const getStatusStyle = (status) => {
        const map = {
            approved: { bg: '#DEF7EC', color: '#03543F' },
            paid: { bg: '#D1FAE5', color: '#065F46' },
            active: { bg: '#D1FAE5', color: '#065F46' },
            pending: { bg: '#FFF4CE', color: '#92400E' },
            rejected: { bg: '#FDE8E8', color: '#9B1C1C' },
            changes_requested: { bg: '#E1EFFE', color: '#1E429F' },
        };
        return map[status] || { bg: '#F3F4F6', color: '#374151' };
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#667B68', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#6B7280', fontWeight: '500' }}>Loading billboard data...</p>
        </div>
    );
    if (!billboard) return null;

    return (
        <div className="view-container" style={{ paddingBottom: '60px' }}>

            {/* ─── Premium Top Bar ─── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.color = '#667B68'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back
                    </button>
                    <div style={{ height: '28px', width: '1px', background: '#E5E7EB' }}></div>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#111827', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{billboard.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#667B68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>{billboard.location}</span>
                            <span style={{ color: '#D1D5DB' }}>•</span>
                            <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontWeight: '600',
                                background: billboard.status === 'approved' ? '#D1FAE5' : '#FFF4CE',
                                color: billboard.status === 'approved' ? '#065F46' : '#92400E'
                            }}>
                                {billboard.status?.charAt(0).toUpperCase() + billboard.status?.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => window.open(`/billboard/${id}/player`, '_blank')}
                        style={{ background: '#fff', border: '1.5px solid #E5E7EB', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#667B68'}
                        onMouseOut={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Preview
                    </button>
                    <button
                        onClick={() => navigate(`/owner/billboard/edit/${id}`)}
                        style={{ background: '#667B68', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(102,123,104,0.3)', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#586A5A'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#667B68'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit Details
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* ─── Overview: Image + Stats ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '28px', marginBottom: '36px' }}>

                {/* Billboard Visual */}
                <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
                    <div style={{ height: '320px', position: 'relative', background: '#1F2937' }}>
                        {billboard.image ? (
                            <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)' }}></div>
                        <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ color: '#fff' }}>
                                <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>NRs. {Number(billboard.base_price).toLocaleString()}</div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>per day</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: '100px', color: '#fff', fontSize: '12px', fontWeight: '700' }}>
                                {billboard.display_type?.toUpperCase() || 'DIGITAL'}
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { label: 'Dimensions', value: billboard.size || 'N/A' },
                            { label: 'Traffic Density', value: billboard.traffic_density || 'N/A', badge: true },
                            { label: 'Visibility Score', value: `${billboard.visibility_score || 'N/A'} / 10` },
                            { label: 'Coordinates', value: billboard.latitude ? `${billboard.latitude}, ${billboard.longitude}` : 'Not set', small: true },
                        ].map((spec, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '6px' }}>{spec.label}</div>
                                {spec.badge ? (
                                    <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>{spec.value}</span>
                                ) : (
                                    <div style={{ fontWeight: spec.small ? '500' : '700', color: spec.small ? '#6B7280' : '#111827', fontSize: spec.small ? '12px' : '15px' }}>{spec.value}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                        { label: 'Active Campaigns', value: activeBookings.length, color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5, #ECFDF5)', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
                        { label: 'Pending Requests', value: pendingBookings.length, color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
                        { label: 'Total Revenue', value: `NRs. ${totalRevenue.toLocaleString()}`, color: '#667B68', bg: 'linear-gradient(135deg, #667B6815, #667B680A)', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667B68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #F3F4F6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{stat.label}</div>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: stat.color, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Description ─── */}
            {billboard.description && (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #F3F4F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '28px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>About This Billboard</h3>
                    <p style={{ margin: 0, color: '#4B5563', lineHeight: '1.7', fontSize: '15px' }}>{billboard.description}</p>
                </div>
            )}

            {/* ─── Interaction History ─── */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Review & Update History</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>Track all interactions and status changes</p>
                    </div>
                    <div style={{ fontSize: '12px', background: '#F3F4F6', padding: '4px 12px', borderRadius: '100px', color: '#6B7280', fontWeight: '700' }}>
                        {history.length} Events
                    </div>
                </div>

                {historyLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        <div style={{ width: '24px', height: '24px', border: '2px solid #E5E7EB', borderTopColor: '#667B68', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                        Fetching interaction history...
                    </div>
                ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '16px', border: '1px dashed #E5E7EB' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#9CA3AF', fontWeight: '500' }}>No history records found for this billboard.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '800px' }}>
                        {history.map((event, idx) => (
                            <div key={event.id} style={{ 
                                position: 'relative', 
                                paddingLeft: '32px', 
                                paddingBottom: idx === history.length - 1 ? '0' : '32px',
                                borderLeft: idx === history.length - 1 ? 'none' : '2px solid #E5E7EB',
                                marginLeft: '8px'
                            }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '-9px', 
                                    top: '0', 
                                    width: '16px', 
                                    height: '16px', 
                                    borderRadius: '50%', 
                                    background: event.action_type === 'admin_review' ? '#667B68' : '#4F46E5',
                                    border: '3px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                                <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #F3F4F6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: '800', 
                                                color: event.action_type === 'admin_review' ? '#667B68' : '#4F46E5',
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.08em',
                                                background: event.action_type === 'admin_review' ? '#667B6810' : '#4F46E510',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block',
                                                marginBottom: '8px'
                                            }}>
                                                {event.action_type === 'admin_review' ? 'Admin Review' : 'Owner Update'}
                                            </span>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                                New Status: <span style={{ 
                                                    color: event.status_result === 'approved' ? '#10B981' : event.status_result === 'rejected' ? '#EF4444' : '#6B7280'
                                                }}>
                                                    {event.status_result.charAt(0).toUpperCase() + event.status_result.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>{event.user_name || 'System'}</div>
                                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{new Date(event.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    
                                    {event.feedback && (
                                        <div style={{ 
                                            background: '#F9FAFB', 
                                            padding: '12px 16px', 
                                            borderRadius: '12px', 
                                            borderLeft: `4px solid ${event.action_type === 'admin_review' ? '#667B68' : '#4F46E5'}`,
                                            fontSize: '14px',
                                            color: '#4B5563',
                                            lineHeight: '1.6'
                                        }}>
                                            {event.feedback}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Booking Schedule with Search/Filter ─── */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                {/* Section Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Booking Schedule</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>{processedBookings.length} booking{processedBookings.length !== 1 ? 's' : ''} found</p>
                    </div>
                </div>

                {/* Controls Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#F9FAFB', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ position: 'relative', minWidth: '260px', flexGrow: 1, maxWidth: '380px' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Search by Campaign, Advertiser, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                            onFocus={e => e.target.style.borderColor = '#667B68'}
                            onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', whiteSpace: 'nowrap' }}>Status:</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                <option value="All">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Paid">Paid</option>
                                <option value="Changes Requested">Changes Requested</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', whiteSpace: 'nowrap' }}>Sort:</label>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                <option value="Newest">Newest First</option>
                                <option value="Oldest">Oldest First</option>
                                <option value="AmountHigh">Amount: High → Low</option>
                                <option value="AmountLow">Amount: Low → High</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Booking List */}
                {processedBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F9FAFB', borderRadius: '16px', border: '1.5px dashed #E5E7EB' }}>
                        <svg style={{ display: 'block', margin: '0 auto 16px', color: '#D1D5DB' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>No bookings found</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Try adjusting your search or filters.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {processedBookings.map(b => {
                            const statusStyle = getStatusStyle(b.booking_status);
                            return (
                                <div
                                    key={b.id}
                                    onClick={() => navigate(`/booking/${b.id}`)}
                                    style={{ display: 'flex', gap: '20px', padding: '20px 24px', borderRadius: '14px', border: '1.5px solid #F3F4F6', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer', background: '#fff' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,123,104,0.12)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    {/* Creative Thumbnail */}
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#F3F4F6', border: '1px solid #E5E7EB', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {b.creative_file ? (
                                            b.creative_file.match(/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i) ? (
                                                <video src={b.creative_file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                            ) : (
                                                <img src={b.creative_file} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        )}
                                    </div>

                                    {/* Campaign Info */}
                                    <div style={{ flex: 1.5, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', color: '#111827', marginBottom: '3px', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {b.campaign_name || `Booking #${b.id}`}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{b.advertiser_email}</div>
                                    </div>

                                    {/* Date Range */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{b.start_date}</div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0' }}>→</div>
                                        <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{b.end_date}</div>
                                    </div>

                                    {/* Playback Specs */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                                        <span>⏱ {b.slot_duration_seconds}s slot</span>
                                        <span><RefreshCw width={20} height={20} /> {b.frequency_per_hour}x per hour</span>
                                    </div>

                                    {/* Amount + Status */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                                            NRs. {parseFloat(b.price_calculated).toLocaleString()}
                                        </div>
                                        <span style={{ fontSize: '11px', background: statusStyle.bg, color: statusStyle.color, padding: '3px 10px', borderRadius: '100px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            {b.booking_status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Arrow */}
                                    <div style={{ color: '#D1D5DB', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default BillboardManage;
