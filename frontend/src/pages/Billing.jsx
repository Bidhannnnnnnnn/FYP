import React, { useState, useEffect, useMemo } from 'react';
import './AdvertiserDashboard.css'; // Leverage existing dashboard styles
import api from '../services/api';

const Billing = () => {
    const [userRole, setUserRole] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    // Filters and Sorting State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest'); // Newest, Oldest, AmountHigh, AmountLow

    useEffect(() => {
        const fetchRoleAndData = async () => {
            try {
                const profileRes = await api.get('user/profile/');
                const role = profileRes.data.role;
                setUserRole(role);

                let endpoint = '';
                if (role === 'advertiser') {
                    endpoint = 'campaigns/bookings/'; // My Bookings
                } else if (role === 'admin' || role === 'business') {
                    endpoint = 'campaigns/owner-bookings/'; // Owner Bookings
                } else if (role === 'superadmin') {
                    endpoint = 'campaigns/bookings/'; // Superadmin sees all
                }

                if (endpoint) {
                    const bookingsRes = await api.get(endpoint);
                    setBookings(bookingsRes.data);

                    const paidTotal = bookingsRes.data
                        .filter(b => b.booking_status === 'paid' || b.booking_status === 'active')
                        .reduce((sum, b) => sum + parseFloat(b.price_calculated || 0), 0);

                    const pendingTotal = bookingsRes.data
                        .filter(b => b.booking_status === 'approved')
                        .reduce((sum, b) => sum + parseFloat(b.price_calculated || 0), 0);

                    setStats({ total: paidTotal, pending: pendingTotal });
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch billing data", err);
                setLoading(false);
            }
        };

        fetchRoleAndData();
    }, []);

    const handlePayment = async (bookingId) => {
        try {
            await api.post(`campaigns/bookings/${bookingId}/pay/`);

            // Show premium custom toast alert instead of window.alert if possible, 
            // but for scope containment, we will update the state directly to 'paid' 
            // and show a visual indicator.
            alert('Payment successfully processed!');

            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_status: 'paid' } : b));

            // Adjust stats dynamically
            const modifiedBooking = bookings.find(b => b.id === bookingId);
            if (modifiedBooking) {
                const price = parseFloat(modifiedBooking.price_calculated || 0);
                setStats(prev => ({
                    total: prev.total + price,
                    pending: prev.pending - price
                }));
            }

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Payment failed.');
        }
    };

    // Derived states (Filtering + Sorting)
    const processedBookings = useMemo(() => {
        let result = [...bookings];

        // 1. Search Filter
        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase();
            result = result.filter(b =>
                (b.id && b.id.toString().includes(query)) ||
                (b.campaign_name && b.campaign_name.toLowerCase().includes(query)) ||
                (b.billboard_title && b.billboard_title.toLowerCase().includes(query)) ||
                (b.campaign && typeof b.campaign === 'string' && b.campaign.toLowerCase().includes(query)) ||
                (b.billboard && typeof b.billboard === 'string' && b.billboard.toLowerCase().includes(query))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(b => {
                const normalizedStatus = b.booking_status.replace('_', ' ').toLowerCase();
                return normalizedStatus === statusFilter.toLowerCase();
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'Newest') {
                return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
            } else if (sortBy === 'Oldest') {
                return new Date(a.created_at || a.start_date) - new Date(b.created_at || b.start_date);
            } else if (sortBy === 'AmountHigh') {
                return parseFloat(b.price_calculated || 0) - parseFloat(a.price_calculated || 0);
            } else if (sortBy === 'AmountLow') {
                return parseFloat(a.price_calculated || 0) - parseFloat(b.price_calculated || 0);
            }
            return 0;
        });

        return result;
    }, [bookings, searchTerm, statusFilter, sortBy]);


    const getRoleLabels = () => {
        if (userRole === 'advertiser') {
            return { totalLabel: 'Total Amount Spent', pendingLabel: 'Pending Payments (Approved)' };
        } else if (userRole === 'superadmin') {
            return { totalLabel: 'Total Platform Revenue', pendingLabel: 'Pending Platform Revenue' };
        } else {
            return { totalLabel: 'Total Earnings', pendingLabel: 'Pending Earnings' };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: '#667B68', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    Loading Finances...
                </div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const { totalLabel, pendingLabel } = getRoleLabels();

    return (
        <div className="view-container">
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: 0, fontSize: '28px', color: '#1F2937', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>Billing & Payments</h3>
                <p style={{ margin: '6px 0 0 0', color: '#6B7280', fontSize: '15px' }}>Comprehensive overview of all your financial transactions.</p>
            </div>

            {/* Financial Stats Row */}
            <div className="stats-row" style={{ marginBottom: '32px' }}>
                <div className="stat-card primary-stat" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div className="stat-content" style={{ position: 'relative', zIndex: 1 }}>
                        <span className="stat-label" style={{ fontSize: '14px', opacity: 0.9 }}>{totalLabel}</span>
                        <div className="stat-value" style={{ fontSize: '36px', marginTop: '4px' }}>NRs. {stats.total.toLocaleString()}</div>
                    </div>
                    <svg style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.1, width: '120px', height: '120px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="stat-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div className="stat-content" style={{ position: 'relative', zIndex: 1 }}>
                        <span className="stat-label" style={{ fontSize: '14px' }}>{pendingLabel}</span>
                        <div className="stat-value" style={{ fontSize: '36px', marginTop: '4px', color: '#1F2937' }}>NRs. {stats.pending.toLocaleString()}</div>
                    </div>
                    <svg style={{ position: 'absolute', right: '10px', bottom: '10px', color: '#F3F4F6', width: '80px', height: '80px', zIndex: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
            </div>

            {/* Controls Row (Search, Filter, Sort) */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ position: 'relative', minWidth: '300px', flexGrow: 1, maxWidth: '400px' }}>
                    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        type="text"
                        placeholder="Search by ID, Campaign, or Billboard..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667B68'}
                        onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Active">Active</option>
                            <option value="Approved">Approved (Pending Payment)</option>
                            <option value="Pending">Pending Approval</option>
                            <option value="Changes Requested">Changes Requested</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Sort:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer' }}
                        >
                            <option value="Newest">Date: Newest First</option>
                            <option value="Oldest">Date: Oldest First</option>
                            <option value="AmountHigh">Amount: High to Low</option>
                            <option value="AmountLow">Amount: Low to High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container" style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (NRs)</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedBookings.map((b) => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                                <td style={{ padding: '16px 20px', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                                    #{b.id.toString().padStart(5, '0')}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>{b.campaign_name || `Campaign #${b.campaign}`}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                                        {b.billboard_title || `Billboard #${b.billboard}`}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ color: '#374151', fontSize: '14px' }}>{b.start_date}</div>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>to {b.end_date}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-block',
                                        backgroundColor:
                                            ['paid', 'active'].includes(b.booking_status) ? '#D1FAE5' :
                                                b.booking_status === 'approved' ? '#FEF3C7' :
                                                    b.booking_status === 'rejected' ? '#FEE2E2' : '#F3F4F6',
                                        color:
                                            ['paid', 'active'].includes(b.booking_status) ? '#065F46' :
                                                b.booking_status === 'approved' ? '#92400E' :
                                                    b.booking_status === 'rejected' ? '#991B1B' : '#374151',
                                    }}>
                                        {b.booking_status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                                    {parseFloat(b.price_calculated).toLocaleString()}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    {b.booking_status === 'approved' && userRole === 'advertiser' ? (
                                        <button
                                            onClick={() => handlePayment(b.id)}
                                            style={{
                                                padding: '8px 16px',
                                                fontSize: '13px',
                                                background: '#10B912',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 4px rgba(16, 185, 18, 0.2)'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#0E9F10'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#10B912'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                                            Pay Now
                                        </button>
                                    ) : ['paid', 'active'].includes(b.booking_status) ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: '600', fontSize: '13px' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Settled
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {processedBookings.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                                    <svg style={{ display: 'block', margin: '0 auto 16px', color: '#D1D5DB' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#4B5563', marginBottom: '4px' }}>No transactions found</div>
                                    <div style={{ fontSize: '14px' }}>We couldn't find any financial records matching your filters.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Billing;
