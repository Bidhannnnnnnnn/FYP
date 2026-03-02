import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css';

import BookingModal from './BookingModal';
import NotificationBell from '../components/Notifications/NotificationBell';
import Profile from './Profile';
import Billing from './Billing';
import BillboardDetails from './BillboardDetails';
import BillboardBooking from './BillboardBooking';
import BookingDetailsView from './BookingDetailsView';

const AdvertiserDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab from URL
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/my-bookings')) return 'bookings';
        if (path.includes('/my-bookings')) return 'bookings';
        if (path.includes('/explore')) return 'explore';
        if (path.includes('/profile')) return 'profile';
        if (path.includes('/billing')) return 'billing';
        if (path.match(/^\/billboard\/\d+\/book$/)) return 'billboardBooking';
        if (path.match(/^\/billboard\/\d+$/)) return 'billboardDetails';
        if (path.match(/^\/booking\/\d+$/)) return 'bookingDetails';
        return 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());

    // Update activeTab when URL changes
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location.pathname]);

    const [user, setUser] = useState({ name: 'User', email: '' });
    const [billboards, setBillboards] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalActiveDays: 0,
        activeBillboards: 0,
        invested: 0
    });
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedBillboard, setSelectedBillboard] = useState(null);
    const [editModal, setEditModal] = useState({ show: false, billboard: null });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchData = async () => {
        try {
            // 1. Fetch User Profile
            const profileRes = await api.get('user/profile/');
            setUser(profileRes.data);

            // 2. Fetch Billboards (available for exploration)
            const boardsRes = await api.get('billboards/list/');
            setBillboards(boardsRes.data);

            // 3. Fetch My Bookings
            const bookingsRes = await api.get('campaigns/bookings/');
            setBookings(bookingsRes.data);

            // 4. Derive Stats
            const activeBookings = bookingsRes.data.filter(b => b.booking_status === 'approved' || b.booking_status === 'pending').length;
            const totalInvested = bookingsRes.data.reduce((acc, curr) => acc + parseFloat(curr.price_calculated || 0), 0);

            const totalDays = bookingsRes.data.reduce((acc, curr) => {
                if (curr.booking_status === 'approved' || curr.booking_status === 'pending') {
                    const start = new Date(curr.start_date);
                    const end = new Date(curr.end_date);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return acc + diffDays;
                }
                return acc;
            }, 0);

            setStats({
                totalActiveDays: totalDays,
                activeBillboards: activeBookings,
                invested: totalInvested
            });

            setLoading(false);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigate('/login');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check for login toast flag from AuthPage/Login
        if (localStorage.getItem('showLoginToast') === 'true') {
            const role = localStorage.getItem('role') || 'Advertiser';
            setToast({
                show: true,
                message: `Logged in as ${role} `,
                type: 'success'
            });
            localStorage.removeItem('showLoginToast');
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        setToast({ show: true, message: 'Logging out...', type: 'error' });
        setTimeout(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            navigate('/login');
        }, 1500);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const handleEditBooking = (booking) => {
        navigate(`/billboard/${booking.billboard}/book?edit=${booking.id}`);
    };

    const handlePayment = async (e, bookingId) => {
        e.stopPropagation();
        try {
            const res = await api.post(`campaigns/bookings/${bookingId}/pay/`);
            setToast({ show: true, message: 'Payment Successful! Booking is now active.', type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
            fetchData();
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: error.response?.data?.error || 'Payment failed.', type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
    };

    // --- Sub-Components (Views) ---

    const DashboardHome = () => (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div className="header-left">
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                        Hi, {user.name}
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                        Here's what's happening with your campaigns today.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                    <div style={{ transform: 'translateX(-5px)' }}>
                        <NotificationBell />
                    </div>
                    <div
                        className="profile-avatar"
                        onClick={() => navigate('/advertiser/profile')}
                        style={{
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            fontSize: '14px'
                        }}
                    >
                        {getInitials(user.name)}
                    </div>
                </div>
            </div>
            <div className="stats-row">
                <div className="stat-card primary-stat">
                    <div className="stat-content">
                        <span className="stat-label">Total Active Days</span>
                        <div className="stat-value">{stats.totalActiveDays}</div>
                    </div>
                    {/* <div className="stat-icon-bg">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div> */}
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-label">Active Campaigns</span>
                        <div className="stat-value">{stats.activeBillboards}</div>
                    </div>
                    {/* <div className="stat-icon-bg">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </div> */}
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-label">Invested NRs.</span>
                        <div className="stat-value">{stats.invested.toLocaleString()}</div>
                    </div>
                    {/* <div className="stat-icon-bg">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div> */}
                </div>
            </div>

            <div className="analytics-section">
                <div className="analytics-header">
                    <h3>Analytics Overview</h3>
                    <div className="analytics-actions">
                        <button className="period-btn active">Week</button>
                        <button className="period-btn">Month</button>
                    </div>
                </div>
                {/* <div className="analytics-chart-container">
                    <svg className="mock-chart" viewBox="0 0 1000 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#667B68" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#667B68" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,150 Q100,100 200,120 T400,80 T600,100 T800,40 T1000,80 V200 H0 Z" fill="url(#chartGradient)" />
                        <path d="M0,150 Q100,100 200,120 T400,80 T600,100 T800,40 T1000,80" fill="none" stroke="#667B68" strokeWidth="3" />
                        <circle cx="200" cy="120" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                        <circle cx="400" cy="80" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                        <circle cx="600" cy="100" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                        <circle cx="800" cy="40" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                    </svg>
                    <div className="chart-labels">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div> */}
            </div>
        </>
    );

    const ExploreBillboards = () => (
        <div className="view-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '24px', color: '#1F2937' }}>Explore Billboards</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '14px' }}>Find the perfect spot for your next campaign.</p>
                </div>
            </div>
            <div className="billboards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                {billboards.length === 0 ? (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #ddd' }}>
                        <p style={{ color: '#6B7280' }}>No billboards available for booking right now.</p>
                    </div>
                ) : billboards.map(bb => (
                    <div key={bb.id} className="billboard-premium-card" style={{
                        background: '#fff',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        border: '1px solid rgba(0,0,0,0.03)',
                        cursor: 'pointer'
                    }} onClick={() => navigate(`/billboard/${bb.id}`)}>
                        <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                            {bb.image ? (
                                <img src={bb.image} alt={bb.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No Preview</div>
                            )}
                            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px' }}>
                                <span style={{
                                    padding: '4px 10px',
                                    background: 'rgba(255,255,255,0.9)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: '30px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#667B68',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}>
                                    {bb.display_type}
                                </span>
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px', color: '#1F2937', fontWeight: '700' }}>{bb.title}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', padding: '2px 8px', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534' }}>{bb.traffic_density} Traffic</span>
                                </div>
                            </div>
                            <p style={{ margin: '0 0 15px 0', color: '#6B7280', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                {bb.location}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #F3F4F6' }}>
                                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Size: {bb.size}</span>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '8px 20px', fontSize: '14px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/billboard/${bb.id}`);
                                    }}
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const MyAds = () => (
        <div className="view-container">
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', color: '#1F2937' }}>My Campaigns</h3>
                <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '14px' }}>Track and manage your active billboard advertisements.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                            <th style={{ padding: '16px 20px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign</th>
                            <th style={{ padding: '16px 20px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billboard</th>
                            <th style={{ padding: '16px 20px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                            <th style={{ padding: '16px 20px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '16px 20px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No campaigns found. Start by exploring billboards!</td></tr>
                        ) : bookings.map(booking => (
                            <tr
                                key={booking.id}
                                style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.2s', cursor: 'pointer' }}
                                className="table-row-hover"
                                onClick={() => navigate(`/booking/${booking.id}`)}
                            >
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6',
                                            border: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {booking.creative_file ? (
                                                booking.creative_file.match(/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i) ? (
                                                    <video src={booking.creative_file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                ) : (
                                                    <img src={booking.creative_file} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )
                                            ) : (
                                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>No Ad</span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: '600', color: '#1F2937' }}>{booking.campaign_name || 'Campaign #' + booking.campaign}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Created {new Date(booking.created_at).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F3F4F6', overflow: 'hidden' }}>
                                            {booking.billboard_details?.image ? (
                                                <img src={booking.billboard_details.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9CA3AF' }}>BB</div>}
                                        </div>
                                        <div style={{ fontWeight: '500', color: '#374151' }}>{booking.billboard_details?.title || 'Billboard #' + booking.billboard}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontSize: '14px', color: '#374151' }}>{booking.start_date}</div>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>to {booking.end_date}</div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{
                                        padding: '6px 14px',
                                        borderRadius: '30px',
                                        background: booking.booking_status === 'approved' ? '#DCFCE7' :
                                            booking.booking_status === 'changes_requested' ? '#DBEAFE' :
                                                booking.booking_status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                        color: booking.booking_status === 'approved' ? '#166534' :
                                            booking.booking_status === 'changes_requested' ? '#1E40AF' :
                                                booking.booking_status === 'rejected' ? '#991B1B' : '#92400E',
                                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em'
                                    }}>
                                        {booking.booking_status.replace('_', ' ')}
                                    </span>
                                    {booking.owner_remarks && (
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6B7280', maxWidth: '200px', fontStyle: 'italic' }}>
                                            "{booking.owner_remarks}"
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {booking.booking_status === 'changes_requested' && (
                                            <button
                                                className="btn-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/billboard/${booking.billboard}/book?edit=${booking.id}`);
                                                }}
                                                style={{ padding: '8px 16px', fontSize: '12px', background: '#3B82F6' }}
                                            >
                                                Fix Issues
                                            </button>
                                        )}
                                        {booking.booking_status === 'approved' && (
                                            <button
                                                className="btn-primary"
                                                onClick={(e) => handlePayment(e, booking.id)}
                                                style={{ padding: '8px 16px', fontSize: '12px', background: '#10B912' }}
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                        <button
                                            style={{ padding: '6px 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', color: '#6B7280' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/billboard/${booking.billboard}`);
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: toast.type === 'success' ? '#10B981' : '#EF4444',
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
                    {toast.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    )}
                    {toast.message}
                </div>
            )}
            {/* Sidebar */}
            <div className="sidebar">
                <div className="brand-section">
                    <h2>BimbaSetu</h2>
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <NavLink
                                to="/advertiser"
                                end
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>
                                <span className="nav-text">Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/advertiser/explore"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg></span>
                                <span className="nav-text">Explore Billboards</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/advertiser/my-bookings"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></span>
                                <span className="nav-text">My Bookings</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <NavLink
                            to="/advertiser/profile"
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}
                        >
                            <div style={{ width: '36px', height: '36px', background: '#667B68', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                                {getInitials(user?.name)}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user?.name || 'Advertiser'}
                            </span>
                        </NavLink>

                        <div style={{ width: '1px', height: '20px', background: '#E5E7EB', margin: '0 12px' }}></div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowLogoutConfirm(true);
                            }}
                            title="Sign Out"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && <DashboardHome />}
                        {activeTab === 'explore' && <ExploreBillboards />}
                        {activeTab === 'bookings' && <MyAds />}
                        {activeTab === 'profile' && <Profile />}
                        {activeTab === 'billing' && <Billing />}
                        {activeTab === 'billboardDetails' && <BillboardDetails />}
                        {activeTab === 'billboardBooking' && <BillboardBooking />}
                        {activeTab === 'bookingDetails' && <BookingDetailsView />}
                    </>
                )}
            </div>

            {selectedBillboard && (
                <BookingModal
                    billboard={selectedBillboard}
                    onClose={() => setSelectedBillboard(null)}
                    onSuccess={() => {
                        fetchData();
                    }}
                />
            )}
            {/* Edit/Revamp Modal */}
            {editModal.show && (
                <BookingModal
                    billboard={editModal.billboard}
                    editMode={true}
                    bookingData={editModal.bookingData}
                    onClose={() => setEditModal({ show: false, billboard: null, bookingData: null })}
                    onSuccess={fetchData}
                />
            )}
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                        <div style={{ marginBottom: '20px', color: '#EF4444' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: '10px' }}>Confirm Sign Out</h2>
                        <p style={{ color: '#6B7280', marginBottom: '25px' }}>Are you sure you want to sign out? You will need to log in again to access your dashboard.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ flex: 1 }}
                            >
                                Stay Logged In
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleLogout}
                                style={{ flex: 1, background: '#EF4444' }}
                            >
                                Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AdvertiserDashboard;
