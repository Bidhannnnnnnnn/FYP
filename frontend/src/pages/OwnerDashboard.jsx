import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css'; // Reuse existing styles
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import NotificationBell from '../components/Notifications/NotificationBell';
import './OwnerDashboard.css';
import BillboardDetails from './BillboardDetails';
import BillboardBooking from './BillboardBooking';
import BillboardManage from './BillboardManage';
import BillboardPlayer from './BillboardPlayer';
import BookingDetailsView from './BookingDetailsView';

const OccupancyAnalytics = ({ myBillboards = [] }) => {
    const [period, setPeriod] = useState('daily');
    const [selectedBillboard, setSelectedBillboard] = useState('all');
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        const fetchChartData = async () => {
            setChartLoading(true);
            try {
                let url = `campaigns/owner-occupancy-stats/?period=${period}`;
                if (selectedBillboard !== 'all') {
                    url += `& billboard_id=${selectedBillboard} `;
                }
                const res = await api.get(url);
                setChartData(res.data.stats || []);
            } catch (err) {
                console.error("Chart Fetch Error:", err);
            } finally {
                setChartLoading(false);
            }
        };
        fetchChartData();
    }, [period, selectedBillboard]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#fff', padding: '15px', borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: 'none'
                }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                        {payload[0].value}% <span style={{ fontSize: '12px', fontWeight: '400', color: '#667B68' }}>Occupancy</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="view-container" style={{ marginTop: '30px', padding: '30px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>Inventory Performance</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6B7280' }}>Real-time occupancy analytics across your billboards.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Billboard Filter */}
                    <select
                        value={selectedBillboard}
                        onChange={(e) => setSelectedBillboard(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            background: '#fff',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                        }}
                    >
                        <option value="all">All Billboards</option>
                        {myBillboards.map(bb => (
                            <option key={bb.id} value={bb.id}>{bb.title}</option>
                        ))}
                    </select>

                    <div style={{ background: '#F3F4F6', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                        {['hourly', 'daily', 'weekly', 'monthly'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    background: period === p ? '#fff' : 'transparent',
                                    color: period === p ? '#111827' : '#6B7280',
                                    boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ height: '350px', width: '100%', position: 'relative' }}>
                {chartLoading ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                        <div style={{ color: '#10B981', fontWeight: '600' }}>Fetching Data...</div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                        No occupancy data available for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}% `}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 10 }} />
                            <Bar
                                dataKey="occupancy"
                                radius={[10, 10, 10, 10]}
                                barSize={period === 'hourly' ? 15 : period === 'daily' ? 40 : 60}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell - ${index} `}
                                        fill={entry.occupancy > 70 ? '#10B981' : entry.occupancy > 30 ? '#667B68' : '#D1D5DB'}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/requests')) return 'requests';
        if (path.includes('/billboards')) return 'billboards';
        if (path.includes('/profile')) return 'profile';
        if (path.includes('/billing')) return 'billing';
        if (path.match(/^\/billboard-manage\/\d+$/)) return 'billboardManage';
        if (path.match(/^\/billboard\/\d+\/player$/)) return 'billboardPlayer';
        if (path.match(/^\/billboard\/\d+\/book$/)) return 'billboardBooking';
        if (path.match(/^\/billboard\/\d+$/)) return 'billboardDetails';
        if (path.match(/^\/booking\/\d+$/)) return 'bookingDetails';
        return 'dashboard'; // default to analytics/dashboard
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());

    // Update activeTab when URL changes
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location.pathname]);

    const [user, setUser] = useState({ name: 'Owner', email: '' });
    const [ownerBookings, setOwnerBookings] = useState([]);
    const [myBillboards, setMyBillboards] = useState([]);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBillboard, setEditingBillboard] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        base_price: '',
        size: '',
        display_type: 'Digital',
        visibility_score: 5,
        traffic_density: 'Medium',
        description: '',
        latitude: '',
        longitude: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        pendingRequests: 0,
        occupancyRate: 0
    });
    const [loading, setLoading] = useState(true);

    // Booking Action Modal State
    const [actionModal, setActionModal] = useState({ show: false, bookingId: null, action: null, title: '' });
    const [actionRemarks, setActionRemarks] = useState('');

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        // Check for login toast flag from AuthPage/Login
        if (localStorage.getItem('showLoginToast') === 'true') {
            const role = localStorage.getItem('role') || 'Owner';
            setToast({
                show: true,
                message: `Logged in as ${role === 'business' ? 'Billboard Owner' : role} `,
                type: 'success'
            });
            localStorage.removeItem('showLoginToast');
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            // 1. Fetch User Profile
            const profileRes = await api.get('user/profile/');
            setUser(profileRes.data);

            // 2. Fetch Owner Bookings
            const bookingsRes = await api.get('campaigns/owner-bookings/');
            setOwnerBookings(bookingsRes.data);

            // 3. Fetch Owner Billboards
            const billboardsRes = await api.get('billboards/my/');
            setMyBillboards(billboardsRes.data);

            // 4. Derive Stats
            const pending = bookingsRes.data.filter(b => b.booking_status === 'pending').length;
            const earnings = bookingsRes.data
                .filter(b => b.booking_status === 'approved')
                .reduce((acc, curr) => acc + parseFloat(curr.price_calculated || 0), 0);

            // Occupancy - Simplified mock for now
            const occupancy = bookingsRes.data.length > 0 ? 85 : 0;

            setStats({
                totalEarnings: earnings,
                pendingRequests: pending,
                occupancyRate: occupancy
            });

            setLoading(false);
        } catch (error) {
            console.error("Owner Dashboard Fetch Error:", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigate('/login');
            }
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const handleLogout = () => {
        setToast({ show: true, message: 'Logging out...', type: 'error' });
        setTimeout(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            navigate('/login');
        }, 1500);
    };

    const handleBookingAction = async () => {
        const { bookingId, action } = actionModal;
        try {
            await api.patch(`campaigns/bookings/${bookingId}/action/`, { action, remarks: actionRemarks });
            alert(`Booking ${action.replace('_', ' ')} successfully`);
            setActionModal({ show: false, bookingId: null, action: null, title: '' });
            setActionRemarks('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error(`Failed to ${action} booking`, error);
            alert(`Failed to ${action} booking: ` + (error.response?.data?.detail || 'Unknown error'));
        }
    };

    const openActionModal = (bookingId, action) => {
        const titles = {
            'approve': 'Approve Booking',
            'reject': 'Reject Booking',
            'request_revision': 'Request Revision'
        };
        setActionModal({ show: true, bookingId, action, title: titles[action] });
        setActionRemarks('');
    };

    // --- Billboard Handlers ---

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setFormData({ ...formData, image: file });
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmitBillboard = async (e) => {
        e.preventDefault();

        // Map traffic density string to integer
        const densityMap = { 'Low': 1, 'Medium': 5, 'High': 10 };

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'image') {
                if (formData.image) data.append('image', formData.image);
            } else if (key === 'traffic_density') {
                data.append('traffic_density', densityMap[formData.traffic_density] || 1);
            } else {
                data.append(key, formData[key]);
            }
        });

        try {
            if (editingBillboard) {
                await api.patch(`billboards/update/${editingBillboard.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Billboard updated successfully!');
            } else {
                await api.post('billboards/add/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Billboard added successfully!');
            }
            setShowAddModal(false);
            setEditingBillboard(null);
            setImagePreview(null);
            setFormData({
                title: '', location: '', base_price: '', size: '',
                display_type: 'Digital', visibility_score: 5, traffic_density: 'Medium',
                description: '', latitude: '', longitude: '', image: null
            });
            fetchData();
        } catch (error) {
            console.error("Billboard Save Error:", error);
            alert('Failed to save billboard: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
        }
    };

    const startEdit = (billboard) => {
        setEditingBillboard(billboard);

        // Map integer to string for UI
        let densityStr = 'Medium';
        if (billboard.traffic_density >= 10) densityStr = 'High';
        else if (billboard.traffic_density <= 1) densityStr = 'Low';

        setFormData({
            title: billboard.title,
            location: billboard.location,
            base_price: billboard.base_price,
            size: billboard.size,
            display_type: billboard.display_type || 'Digital',
            visibility_score: billboard.visibility_score || 5,
            traffic_density: densityStr,
            description: billboard.description || '',
            latitude: billboard.latitude || '',
            longitude: billboard.longitude || '',
            image: null // We don't preload the image file object
        });
        setImagePreview(billboard.image); // Show existing image
        setShowAddModal(true);
    };

    const handleDeleteBillboard = async (id) => {
        if (!window.confirm("Are you sure you want to delete this billboard?")) return;
        try {
            await api.delete(`billboards/delete/${id}/`);
            alert('Billboard deleted.');
            fetchData();
        } catch (error) {
            alert('Failed to delete.');
        }
    };



    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="brand-section">
                    <h2>Owner Portal</h2>
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <NavLink
                                to="/owner/analytics"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span>
                                <span className="nav-text">Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/owner/requests"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                                <span className="nav-text">Requests</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/owner/billboards"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg></span>
                                <span className="nav-text">My Billboards</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/owner/billing"
                                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            >
                                <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>
                                <span className="nav-text">Billing & Payments</span>
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
                            to="/owner/profile"
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}
                        >
                            <div style={{ width: '36px', height: '36px', background: '#667B68', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                                {getInitials(user?.name)}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user?.name || 'Owner'}
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


                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && <DashboardHome
                            user={user}
                            stats={stats}
                            myBillboards={myBillboards}
                            navigate={navigate}
                            getInitials={getInitials}
                        />}
                        {activeTab === 'requests' && <BookingRequests
                            ownerBookings={ownerBookings}
                            openActionModal={openActionModal}
                            navigate={navigate}
                        />}
                        {activeTab === 'billboards' && <MyBillboards
                            myBillboards={myBillboards}
                            navigate={navigate}
                            setEditingBillboard={setEditingBillboard}
                            setFormData={setFormData}
                            setShowAddModal={setShowAddModal}
                        />}
                        {activeTab === 'profile' && <Profile />}
                        {activeTab === 'billing' && <Billing />}
                        {activeTab === 'billboardDetails' && <BillboardDetails />}
                        {activeTab === 'billboardBooking' && <BillboardBooking />}
                        {activeTab === 'billboardManage' && <BillboardManage />}
                        {activeTab === 'billboardPlayer' && <BillboardPlayer />}
                        {activeTab === 'bookingDetails' && <BookingDetailsView />}
                    </>
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0 }}>{editingBillboard ? '✨ Refine Billboard' : 'Add New Billboard'}</h2>
                                <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Fill in the details to list your billboard on the platform.</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px' }}>
                            <form onSubmit={handleSubmitBillboard}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>

                                    {/* Left Column: Basic Info & Specs */}
                                    <div className="form-sections">
                                        <section style={{ marginBottom: '25px' }}>
                                            <h4 style={{ marginBottom: '15px', color: '#3B82F6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                                General Information
                                            </h4>
                                            <div className="form-group">
                                                <label>Billboard Title</label>
                                                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Kathmandu Mall Digital LED" required />
                                            </div>
                                            <div className="form-group">
                                                <label>Location</label>
                                                <input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Street, District" required />
                                            </div>
                                            <div className="form-group">
                                                <label>Description (Optional)</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the visibility, target audience, and key highlights..."
                                                    style={{ height: '80px', resize: 'none' }}
                                                />
                                            </div>
                                        </section>

                                        <section>
                                            <h4 style={{ marginBottom: '15px', color: '#3B82F6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                                Pricing & Specs
                                            </h4>
                                            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Daily Rate (NRs.)</label>
                                                    <input name="base_price" type="number" value={formData.base_price} onChange={handleInputChange} required />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Dimensions</label>
                                                    <input name="size" value={formData.size} onChange={handleInputChange} placeholder="e.g. 20ft x 10ft" required />
                                                </div>
                                            </div>
                                            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Display Type</label>
                                                    <select name="display_type" value={formData.display_type} onChange={handleInputChange}>
                                                        <option value="Digital">Digital (LED)</option>
                                                        <option value="Static">Static (Vinyl)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Traffic Density</label>
                                                    <select name="traffic_density" value={formData.traffic_density} onChange={handleInputChange}>
                                                        <option value="Low">Low (Quiet Area)</option>
                                                        <option value="Medium">Medium (Main Road)</option>
                                                        <option value="High">High (Major Junction)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right Column: Visuals & Location */}
                                    <div className="form-sections">
                                        <section style={{ marginBottom: '25px' }}>
                                            <h4 style={{ marginBottom: '15px', color: '#10B981', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                                Visuals
                                            </h4>
                                            <div className="image-upload-area" style={{
                                                border: '2px dashed #ddd',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                textAlign: 'center',
                                                background: '#f9fafb',
                                                position: 'relative',
                                                height: '220px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}>
                                                {imagePreview ? (
                                                    <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                            Change
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🖼️</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Upload Billboard Image</div>
                                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>PNG, JPG up to 10MB</div>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    name="image"
                                                    onChange={handleInputChange}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                />
                                            </div>
                                        </section>

                                        <section>
                                            <h4 style={{ marginBottom: '15px', color: '#10B981', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                                Geo-Coordinates (Optional)
                                            </h4>
                                            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Latitude</label>
                                                    <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleInputChange} placeholder="e.g. 27.7172" />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Longitude</label>
                                                    <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleInputChange} placeholder="e.g. 85.3240" />
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                                Used for plotting on our interactive map.
                                            </p>
                                        </section>
                                    </div>

                                </div>

                                <div className="modal-footer" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ minWidth: '150px' }}>
                                        {editingBillboard ? 'Update Billboard' : 'Create Billboard'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Booking Action Modal (Approve/Reject/Revision) */}
            {actionModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{actionModal.title}</h2>
                            <button className="close-btn" onClick={() => setActionModal({ show: false })}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '15px', color: '#4B5563' }}>
                                {actionModal.action === 'approve'
                                    ? "Add an optional message for the advertiser (e.g. contact details)."
                                    : actionModal.action === 'request_revision'
                                        ? "Explain what needs to be fixed so the client can revamp their booking."
                                        : "Why are you rejecting this booking?"}
                            </p>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                    Message to Client {actionModal.action !== 'approve' && <span style={{ color: 'red' }}>*</span>}
                                </label>
                                <textarea
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #D1D5DB',
                                        minHeight: '120px',
                                        fontFamily: 'inherit',
                                        fontSize: '14px'
                                    }}
                                    placeholder="Type your message here..."
                                    value={actionRemarks}
                                    onChange={(e) => setActionRemarks(e.target.value)}
                                    required={actionModal.action !== 'approve'}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '15px', marginTop: '10px' }}>
                            <button className="btn-secondary" onClick={() => setActionModal({ show: false })}>Cancel</button>
                            <button
                                className="btn-primary"
                                onClick={handleBookingAction}
                                disabled={actionModal.action !== 'approve' && !actionRemarks.trim()}
                                style={{
                                    background: actionModal.action === 'reject' ? '#EF4444' : actionModal.action === 'request_revision' ? '#3B82F6' : '#667B68'
                                }}
                            >
                                Confirm {actionModal.title.split(' ')[0]}
                            </button>
                        </div>
                    </div>
                </div>
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
        </div>
    );
};

const DashboardHome = ({ user, stats, myBillboards, navigate, getInitials }) => (
    <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div className="header-left">
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', margin: '0 0 8px 0', color: '#1F2937', fontWeight: '700' }}>
                    Welcome, {user.name}
                </h1>
                <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                    Manage your billboards and bookings.
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                <div style={{ transform: 'translateX(-5px)' }}>
                    <NotificationBell />
                </div>
                <div
                    className="avatar-header"
                    onClick={() => navigate('/owner/profile')}
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
            <div className="stat-card primary-stat">
                <div className="stat-content">
                    <span className="stat-label">Total Earnings</span>
                    <div className="stat-value">NRs. {stats.totalEarnings.toLocaleString()}</div>
                </div>
                <div className="stat-icon-bg">NRs.</div>
            </div>
            <div className="stat-card">
                <div className="stat-content">
                    <span className="stat-label">Pending Requests</span>
                    <div className="stat-value">{stats.pendingRequests}</div>
                </div>
                <div className="stat-icon-bg">?</div>
            </div>
            <div className="stat-card">
                <div className="stat-content">
                    <span className="stat-label">My Billboards</span>
                    <div className="stat-value">{myBillboards.length}</div>
                </div>
                <div className="stat-icon-bg">B</div>
            </div>
        </div>

        <OccupancyAnalytics myBillboards={myBillboards} />
    </>
);

const BookingRequests = ({ ownerBookings, openActionModal, navigate }) => (
    <div className="view-container">
        <h3>Booking Requests</h3>
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
                <tr style={{ textAlign: 'left', color: '#6B7280' }}>
                    <th style={{ padding: '10px' }}>Campaign</th>
                    <th>Billboard</th>
                    <th>Dates</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {ownerBookings.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No booking requests.</td></tr>
                ) : ownerBookings.map(booking => (
                    <tr
                        key={booking.id}
                        style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', cursor: 'pointer' }}
                        className="table-row-hover"
                        onClick={() => navigate(`/booking/${booking.id}`)}
                    >
                        <td style={{ padding: '16px' }}>{booking.campaign_name || 'Campaign #' + booking.campaign}</td>
                        <td style={{ padding: '16px' }}>{booking.billboard_details?.title || 'Billboard #' + booking.billboard}</td>
                        <td style={{ padding: '16px' }}>{booking.start_date} to {booking.end_date}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>NRs. {booking.price_calculated}</td>
                        <td style={{ padding: '16px' }}>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: booking.booking_status === 'approved' ? '#DEF7EC' :
                                    booking.booking_status === 'changes_requested' ? '#E1EFFE' :
                                        booking.booking_status === 'rejected' ? '#FDE8E8' : '#FFF4CE',
                                color: booking.booking_status === 'approved' ? '#03543F' :
                                    booking.booking_status === 'changes_requested' ? '#1E429F' :
                                        booking.booking_status === 'rejected' ? '#9B1C1C' : '#92400E',
                                fontSize: '12px', fontWeight: '600'
                            }}>
                                {booking.booking_status.replace('_', ' ').toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                            {booking.booking_status === 'pending' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openActionModal(booking.id, 'approve');
                                        }}
                                        style={{ padding: '6px 12px', background: '#667B68', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openActionModal(booking.id, 'request_revision');
                                        }}
                                        style={{ padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        Revision
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openActionModal(booking.id, 'reject');
                                        }}
                                        style={{ padding: '6px 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                            {booking.booking_status === 'changes_requested' && (
                                <span style={{ fontSize: '13px', color: '#6B7280' }}>Waiting for client revision...</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MyBillboards = ({ myBillboards, navigate, setEditingBillboard, setFormData, setShowAddModal }) => (
    <div className="view-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>My Billboards</h3>
            <button
                className="btn-primary"
                onClick={() => {
                    setEditingBillboard(null);
                    setFormData({ title: '', location: '', base_price: '', size: '', display_type: 'Digital', visibility_score: 5, traffic_density: 'Medium' });
                    setShowAddModal(true);
                }}
            >
                + Add New Billboard
            </button>
        </div>

        <div className="billboards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {myBillboards.length === 0 ? <p>No billboards found.</p> : myBillboards.map(bb => (
                <div key={bb.id} className="billboard-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: bb.status === 'approved' ? '#d1fae5' : '#fffbeb', color: bb.status === 'approved' ? '#065f46' : '#92400E' }}>
                            {bb.status}
                        </span>
                    </div>
                    <div style={{ height: '140px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                        {bb.image ? (
                            <img src={bb.image} alt={bb.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                No Image
                            </div>
                        )}
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1F2937' }}>{bb.title}</h4>
                    <p style={{ margin: '0 0 4px 0', color: '#6B7280', fontSize: '14px' }}>{bb.location}</p>
                    <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '15px', fontWeight: 'bold' }}>NRs. {bb.base_price}/day</p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => navigate(`/billboard-manage/${bb.id}`)}
                            style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Manage Billboard
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default OwnerDashboard;
