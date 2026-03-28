import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '220px' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '8px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: '13px', color: selectedOption ? '#111827' : '#9CA3AF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '40px', boxSizing: 'border-box'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '250px', width: '250px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            margin: '8px', padding: '8px 12px', border: '1px solid #E5E7EB',
                            borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#F9FAFB'
                        }}
                        autoFocus
                    />
                    <div style={{ overflowY: 'auto' }}>
                        <div 
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            style={{ padding: '8px 14px', cursor: 'pointer', background: value === '' ? '#F3F4F6' : 'transparent', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}
                        >
                            All
                        </div>
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                                style={{
                                    padding: '8px 14px', cursor: 'pointer',
                                    background: value === opt.value ? '#F0FDF4' : 'transparent',
                                    color: value === opt.value ? '#059669' : '#374151',
                                    fontSize: '13px', fontWeight: '500'
                                }}
                            >
                                {opt.label}
                            </div>
                        )) : (
                            <div style={{ padding: '10px 14px', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
import NotificationBell from '../Notifications/NotificationBell';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff', padding: '15px', borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: 'none'
            }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {payload[0].name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: payload[0].payload.fill }} />
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                        {payload[0].value} <span style={{ fontSize: '12px', fontWeight: '500', color: '#9CA3AF' }}>Items</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const fullDate = payload[0].payload.fullDate;
        return (
            <div style={{
                background: '#fff', padding: '15px', borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: 'none'
            }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                    {label} {fullDate ? <span style={{color: '#9CA3AF', fontWeight: '400', marginLeft: '4px'}}>({fullDate})</span> : null}
                </p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                    NRs. {payload[0].value.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '400', color: '#667B68' }}>Revenue</span>
                </p>
            </div>
        );
    }
    return null;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = {
        name: localStorage.getItem('name') || 'Admin',
        role: localStorage.getItem('role') || 'superadmin'
    };

    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingBillboards: 0,
        approvedBillboards: 0
    });
    const [chartData, setChartData] = useState({
        roles: [],
        billboardStatuses: [],
        bookingStatuses: [],
        monthlyRevenue: []
    });

    const [rawData, setRawData] = useState({ users: [], billboards: [], bookings: [] });
    const [filters, setFilters] = useState({ ownerId: '', billboardId: '' });
    const [revenuePeriod, setRevenuePeriod] = useState('monthly');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersRes = await api.get('user/userlist/');
                const billboardsRes = await api.get('billboards/my/'); // Admin gets all
                const bookingsRes = await api.get('campaigns/owner-bookings/'); // SuperAdmin gets all platform bookings

                const users = Array.isArray(usersRes.data) ? usersRes.data : [];
                const billboards = Array.isArray(billboardsRes.data) ? billboardsRes.data : [];
                const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

                setRawData({ users, billboards, bookings });
            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const { users, billboards, bookings } = rawData;
        if (!users.length && !billboards.length && !bookings.length) return;

        setStats({
            totalUsers: users.length,
            pendingBillboards: billboards.filter(b => b.status === 'pending').length,
            approvedBillboards: billboards.filter(b => b.status === 'approved').length,
        });

        // Prepare global charts
        const roleCounts = users.reduce((acc, u) => {
            const role = u.role || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
        const rolesData = Object.keys(roleCounts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            value: roleCounts[key]
        }));

        const statusCounts = billboards.reduce((acc, bb) => {
            const status = bb.status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const statusesData = Object.keys(statusCounts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            value: statusCounts[key]
        }));

        const bookingStatusCounts = bookings.reduce((acc, b) => {
            const bStatus = b.booking_status || 'unknown';
            acc[bStatus] = (acc[bStatus] || 0) + 1;
            return acc;
        }, {});
        const bookingStatusesData = Object.keys(bookingStatusCounts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            value: bookingStatusCounts[key]
        }));

        // Contextual Revenue Filtering
        let filteredBookings = bookings;
        if (filters.ownerId) {
            filteredBookings = filteredBookings.filter(b => {
                const bbd = billboards.find(board => board.id === b.billboard);
                return bbd?.owner?.id?.toString() === filters.ownerId.toString() || bbd?.owner?.email === filters.ownerId.toString();
            });
        }
        if (filters.billboardId) {
            filteredBookings = filteredBookings.filter(b => b.billboard?.toString() === filters.billboardId.toString());
        }

        let revenueData = [];
        const now = new Date();
        
        if (revenuePeriod === 'hourly') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            for (let i = 0; i < 24; i++) {
                const hourStr = `${i.toString().padStart(2, '0')}:00`;
                const exactDate = new Date(todayStart.getTime() + i * 3600000);
                revenueData.push({ 
                    name: hourStr, 
                    fullDate: exactDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                    Revenue: 0, _start: exactDate, _end: new Date(todayStart.getTime() + (i + 1) * 3600000) 
                });
            }
        } else if (revenuePeriod === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                revenueData.push({ 
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
                    fullDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                    Revenue: 0, _start: d, _end: new Date(d.getTime() + 86400000) 
                });
            }
        } else if (revenuePeriod === 'weekly') {
            for (let i = 3; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
                const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); // Sunday
                const weekEnd = new Date(weekStart.getTime() + 6 * 86400000); // Saturday
                revenueData.push({ 
                    name: `Week ${4 - i}`, 
                    fullDate: `${weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`,
                    Revenue: 0, _start: weekStart, _end: new Date(weekStart.getTime() + 7 * 86400000) 
                });
            }
        } else {
            const monthsStr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                revenueData.push({ 
                    name: monthsStr[monthDate.getMonth()], 
                    fullDate: monthDate.getFullYear().toString(),
                    Revenue: 0, _start: monthDate, _end: nextMonthDate 
                });
            }
        }

        filteredBookings.forEach(b => {
            if (['approved', 'active', 'paid'].includes(b.booking_status) && b.created_at) {
                try {
                    const bDate = new Date(b.created_at);
                    const price = parseFloat(b.price_calculated) || 0;
                    const bucket = revenueData.find(d => bDate >= d._start && bDate < d._end);
                    if (bucket) bucket.Revenue += price;
                } catch (e) {}
            }
        });
        
        let finalRevenueData = revenueData.map(r => ({ name: r.name, fullDate: r.fullDate, Revenue: r.Revenue }));

        setChartData({ 
            roles: rolesData, 
            billboardStatuses: statusesData,
            bookingStatuses: bookingStatusesData,
            monthlyRevenue: finalRevenueData
        });
    }, [rawData, filters, revenuePeriod]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Options for dropdowns
    const owners = rawData.users
        .filter(u => u.role === 'business')
        .map(u => ({ value: (u.id || u.email).toString(), label: u.name || u.email }));
        
    const candidateBillboards = filters.ownerId 
        ? rawData.billboards.filter(b => b.owner?.id?.toString() === filters.ownerId || b.owner?.email === filters.ownerId)
        : rawData.billboards;
    const filteredBillboards = candidateBillboards.map(b => ({ value: b.id.toString(), label: b.title }));

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div className="header-left">
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                        Welcome, {user.name}
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                        Helping you supervise the system with ease.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                    <div style={{ transform: 'translateX(-5px)' }}>
                        <NotificationBell />
                    </div>
                    <div
                        className="avatar-header"
                        onClick={() => navigate('/admin/profile')}
                        style={{
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700'
                        }}
                    >
                        {getInitials(user.name)}
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card primary-stat" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
                    <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <div className="stat-value">{stats.totalUsers}</div>
                    </div>
                    <div className="stat-icon-bg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/admin/billboards')} style={{ cursor: 'pointer' }}>
                    <div className="stat-content">
                        <span className="stat-label" style={{ color: '#D97706' }}>Pending Billboards</span>
                        <div className="stat-value">{stats.pendingBillboards}</div>
                    </div>
                    <div className="stat-icon-bg" style={{ background: '#FEF3C7', color: '#D97706' }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/admin/billboards')} style={{ cursor: 'pointer' }}>
                    <div className="stat-content">
                        <span className="stat-label" style={{ color: '#059669' }}>Approved Billboards</span>
                        <div className="stat-value">{stats.approvedBillboards}</div>
                    </div>
                    <div className="stat-icon-bg" style={{ background: '#D1FAE5', color: '#059669' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', color: '#1F2937', margin: '0 0 15px 0', fontWeight: '600' }}>System Status & Analytics</h3>
                <p style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', margin: '0 0 24px 0', padding: '16px', background: '#DEF7EC', borderRadius: '12px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 0 4px #A7F3D0' }}></span>
                    The system is running normally. All services are operational.
                </p>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Users Distribution Chart */}
                    <div className="view-container" style={{ flex: '1 1 400px', background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Users by Role</h3>
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Platform account distribution.</p>
                        </div>
                        <div style={{ height: '280px' }}>
                            {chartData.roles.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.roles}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.roles.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomPieTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading chart...</div>}
                        </div>
                    </div>

                    {/* Billboard Statuses Chart */}
                    <div className="view-container" style={{ flex: '1 1 350px', background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Billboards by Status</h3>
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Current inventory approval status.</p>
                        </div>
                        <div style={{ height: '280px' }}>
                            {chartData.billboardStatuses.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.billboardStatuses}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.billboardStatuses.map((entry, index) => {
                                                const colorsMap = { 'Approved': '#10B981', 'Pending': '#F59E0B', 'Rejected': '#EF4444' };
                                                return <Cell key={`cell-${index}`} fill={colorsMap[entry.name] || COLORS[index % COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <RechartsTooltip content={<CustomPieTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No billboard data found.</div>}
                        </div>
                    </div>

                    {/* Platform Booking Statuses Chart */}
                    <div className="view-container" style={{ flex: '1 1 350px', background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Platform Bookings</h3>
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6B7280' }}>All system bookings distribution.</p>
                        </div>
                        <div style={{ height: '280px' }}>
                            {chartData.bookingStatuses.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.bookingStatuses}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.bookingStatuses.map((entry, index) => {
                                                const clrMap = { 'Approved': '#10B981', 'Pending': '#F59E0B', 'Rejected': '#EF4444', 'Changes Requested': '#3B82F6', 'Active': '#047857', 'Paid': '#34D399' };
                                                return <Cell key={`cell-${index}`} fill={clrMap[entry.name] || COLORS[index % COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <RechartsTooltip content={<CustomPieTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No platform bookings found.</div>}
                        </div>
                    </div>


                    {/* Monthly Revenue BarChart */}
                    <div className="view-container" style={{ flex: '1 1 100%', background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Platform Revenue Trend (NRs)</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Gross revenue generated across all campaigns monthly.</p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', zIndex: 10 }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <SearchableSelect options={owners} value={filters.ownerId} onChange={(val) => setFilters({ ...filters, ownerId: val, billboardId: '' })} placeholder="Filter by Business Owner" />
                                    <SearchableSelect options={filteredBillboards} value={filters.billboardId} onChange={(val) => setFilters({ ...filters, billboardId: val })} placeholder="Filter by Billboard" />
                                </div>
                                <div style={{ background: '#F3F4F6', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                                    {['hourly', 'daily', 'weekly', 'monthly'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setRevenuePeriod(p)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600',
                                                cursor: 'pointer', transition: 'all 0.2s ease',
                                                background: revenuePeriod === p ? '#fff' : 'transparent',
                                                color: revenuePeriod === p ? '#111827' : '#6B7280',
                                                boxShadow: revenuePeriod === p ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ height: '320px' }}>
                            {chartData.monthlyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.monthlyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13 }} tickFormatter={(v) => `NRs. ${v}`} />
                                        <RechartsTooltip cursor={{ fill: '#F9FAFB', radius: 10 }} content={<CustomBarTooltip />} />
                                        <Bar dataKey="Revenue" radius={[10, 10, 10, 10]} barSize={revenuePeriod === 'hourly' ? 15 : revenuePeriod === 'daily' ? 40 : 45}>
                                            {chartData.monthlyRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={'#3B82F6'} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No revenue activity found.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
