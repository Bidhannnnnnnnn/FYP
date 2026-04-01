import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import api from '../../services/api';
import '../../pages/AdvertiserDashboard.css';
import logoImg from '../../assets/BimbasetuLogo.png';
import { Book, Building, Folder, Image, MapPin, Phone } from 'lucide-react';

const AdminBillboardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [billboard, setBillboard] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [confirm, setConfirm]     = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });
    const [history, setHistory]     = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const adminName = localStorage.getItem('name') || 'Super Admin';

    useEffect(() => {
        const fetchBillboard = async () => {
            try {
                const res = await api.get(`billboards/detail/${id}/`);
                setBillboard(res.data);
            } catch (err) {
                console.error('Failed to load billboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBillboard();
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

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3200);
    };

    const performAction = async () => {
        if (!confirm) return;
        setActionLoading(true);
        const statusMap = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
        try {
            await api.patch(`billboards/approve/${id}/`, { 
                action: confirm.action,
                feedback_message: confirm.action === 'reject' ? confirm.feedbackMessage : '' 
            });
            setBillboard(prev => ({ ...prev, status: statusMap[confirm.action] }));
            fetchHistory(); // Refresh history
            showToast(`Billboard request updated successfully.`, 'success');
        } catch (err) {
            console.error('Action failed', err);
            showToast('Action failed. Please try again.', 'error');
        } finally {
            setActionLoading(false);
            setConfirm(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        navigate('/login');
    };

    /* ── Sidebar nav items ── */
    const NAV = [
        { to: '/admin', end: true, label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
        { to: '/admin/bookings',   label: 'Bookings',          icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
        { to: '/admin/billboards', label: 'Billboards',        icon: <><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></> },
        { to: '/admin/users',      label: 'Users',             icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
        { to: '/admin/billing',    label: 'Finance & Billing', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    ];

    /* ── Status config ── */
    const STATUS_CFG = {
        pending:  { label: 'Pending',      cls: 'status-pending',  actions: [{ action: 'approve', label: 'Approve', primary: true }, { action: 'reject', label: 'Request Changes', primary: false }] },
        approved: { label: 'Approved',     cls: 'status-approved', actions: [{ action: 'hide', label: 'Hide from Marketplace', primary: false }, { action: 'reject', label: 'Request Changes', primary: false }] },
        rejected: { label: 'Needs Changes', cls: 'status-rejected', actions: [{ action: 'approve', label: 'Approve & Live', primary: true }] },
        hidden:   { label: 'Hidden',       cls: 'status-pending',  actions: [{ action: 'approve', label: 'Restore to Marketplace', primary: true }, { action: 'reject', label: 'Request Changes', primary: false }] },
    };

    const Sidebar = () => (
        <div className="sidebar">
            <div className="brand-section">
                <img src={logoImg} alt="Bimbasetu Logo" className="sidebar-logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div className="nav-section-label">Menu</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li><NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span><span className="nav-text">Dashboard</span></NavLink></li>
                    <li><NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span className="nav-text">Bookings</span></NavLink></li>
                    <li><NavLink to="/admin/billboards" className={({ isActive }) => (isActive || location.pathname.startsWith('/admin/billboard')) ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg></span><span className="nav-text">Billboards</span></NavLink></li>
                    <li><NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span className="nav-text">Users</span></NavLink></li>
                </ul>
                <div className="nav-section-label" style={{ marginTop: '24px' }}>Finance</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li><NavLink to="/admin/billing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span><span className="nav-text">Finance & Billing</span></NavLink></li>
                </ul>
                <div className="nav-section-label" style={{ marginTop: '24px' }}>Account</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li><NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span><span className="nav-text">Settings</span></NavLink></li>
                    <li><NavLink to="/about" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span><span className="nav-text">About Us</span></NavLink></li>
                </ul>
            </nav>
            <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', gap: '10px', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <NavLink to="/admin/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #667B68, #4A5D4C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                            {adminName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Super Admin</div>
                        </div>
                    </NavLink>
                    <button onClick={handleLogout} title="Sign Out"
                        style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );

    /* ── Loading / Not found ── */
    if (loading) return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#6B7280' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid #E5E7EB', borderTopColor: '#667B68', borderRadius: '50%', animation: 'abSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    Loading billboard details…
                </div>
            </div>
            <style>{`@keyframes abSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!billboard) return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#6B7280', marginBottom: '16px' }}>Billboard not found.</p>
                    <button className="btn-primary" onClick={() => navigate('/admin/billboards')}>← Back to Billboards</button>
                </div>
            </div>
        </div>
    );

    const cfg = STATUS_CFG[billboard.status] || STATUS_CFG.hidden;

    return (
        <div className="dashboard-container">
            {/* Toast */}
            {toast.show && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: toast.type === 'success' ? '#10B981' : '#EF4444', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', animation: 'slideInRight 0.3s ease-out' }}>
                    {toast.type === 'success'
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    {toast.message}
                </div>
            )}

            <Sidebar />

            <div className="main-content">
                {/* Back nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                    <button onClick={() => navigate('/admin/billboards')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontWeight: '500', fontSize: '14px', padding: '4px 0', fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#667B68'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Billboards
                    </button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{billboard.title}</span>
                </div>

                {/* Page title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{billboard.title}</h1>
                        <p style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {billboard.location}
                        </p>
                    </div>
                    <span className={`status-badge ${cfg.cls}`} style={{ fontSize: '13px', padding: '8px 16px', marginTop: '6px' }}>
                        {cfg.label}
                    </span>
                </div>

                {/* Two-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Billboard image */}
                        <div style={{ borderRadius: '20px', overflow: 'hidden', height: '300px', background: '#F3F4F6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            {billboard.image
                                ? <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#6B7280' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                                    <span style={{ fontSize: '14px' }}>No image uploaded</span>
                                  </div>
                            }
                        </div>

                        {/* Specifications */}
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                            <h3>Specifications</h3>
                            <table className="admin-table">
                                <tbody>
                                    {[
                                        { label: 'Daily Rate',       value: billboard.base_price ? `NRs. ${billboard.base_price}` : '—' },
                                        { label: 'Dimensions',       value: billboard.size || '—' },
                                        { label: 'Display Type',     value: billboard.display_type || '—' },
                                        { label: 'Traffic Density',  value: billboard.traffic_density != null ? `${billboard.traffic_density}/10` : '—' },
                                        { label: 'Visibility Score', value: billboard.visibility_score != null ? `${billboard.visibility_score}/10` : '—' },
                                        { label: 'Latitude',         value: billboard.latitude  ? parseFloat(billboard.latitude).toFixed(6)  : '—' },
                                        { label: 'Longitude',        value: billboard.longitude ? parseFloat(billboard.longitude).toFixed(6) : '—' },
                                        { label: 'Listing ID',       value: `#${billboard.id}` },
                                        { label: 'Date Added',       value: billboard.created_at ? new Date(billboard.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                                    ].map(row => (
                                        <tr key={row.label}>
                                            <td style={{ color: '#6B7280', fontWeight: '500', width: '40%', fontSize: '13px' }}>{row.label}</td>
                                            <td style={{ fontWeight: '600', fontSize: '14px' }}>{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Description */}
                        {billboard.description && (
                            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                                <h3>Description</h3>
                                <p style={{ color: '#6B7280', lineHeight: '1.7', margin: 0, fontSize: '14px' }}>{billboard.description}</p>
                            </div>
                        )}

                        {/* Legal Documents */}
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Legal Documents</h3>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#667B68', background: '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
                                    {billboard.documents?.length || 0} Attached
                                </span>
                            </div>
                            
                            {!billboard.documents || billboard.documents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#F9FAFB', borderRadius: '16px', border: '1.5px dashed #E5E7EB' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}><Folder width={20} height={20} /></div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>No legal documents uploaded yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {billboard.documents.map((doc, idx) => (
                                        <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', borderRadius: '14px', border: '1px solid #F3F4F6', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.transform = 'none'; }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: doc.file?.toLowerCase().endsWith('.pdf') ? '#FEF2F2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                                {doc.file?.toLowerCase().endsWith('.pdf') ? <Book width={20} height={20} /> : <Image width={20} height={20} />}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {doc.file ? doc.file.split('/').pop() : `Document ${idx + 1}`}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                            </div>
                                            <a href={doc.file} target="_blank" rel="noopener noreferrer" 
                                                style={{ padding: '8px', borderRadius: '8px', background: '#F3F4F6', color: '#4B5563', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#667B68'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Interaction History */}
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>Interaction & Review History</h3>
                                <div style={{ fontSize: '12px', background: '#F3F4F6', padding: '4px 10px', borderRadius: '12px', color: '#6B7280', fontWeight: '600' }}>
                                    {history.length} Events
                                </div>
                            </div>

                            {historyLoading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>Loading history...</div>
                            ) : history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>No history recorded yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {history.map((event, idx) => (
                                        <div key={event.id} style={{ 
                                            position: 'relative', 
                                            paddingLeft: '24px', 
                                            paddingBottom: idx === history.length - 1 ? '0' : '24px',
                                            borderLeft: idx === history.length - 1 ? 'none' : '2px solid #E5E7EB',
                                            marginLeft: '6px'
                                        }}>
                                            <div style={{ 
                                                position: 'absolute', 
                                                left: '-6px', 
                                                top: '0', 
                                                width: '10px', 
                                                height: '10px', 
                                                borderRadius: '50%', 
                                                background: event.action_type === 'admin_review' ? '#667B68' : '#4F46E5',
                                                border: '2px solid #fff'
                                            }} />
                                            <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: event.action_type === 'admin_review' ? '#667B68' : '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {event.action_type === 'admin_review' ? 'Admin Feedback' : 'User Update'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                        {new Date(event.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                                    Status changed to: <span style={{ color: '#111827' }}>{event.status_result}</span>
                                                </div>
                                                {event.feedback && (
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', background: '#F9FAFB', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #E5E7EB' }}>
                                                        {event.feedback}
                                                    </p>
                                                )}
                                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                    By {event.user_name || 'System'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Admin controls */}
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                            <h3>Admin Controls</h3>
                            {billboard.status === 'pending' && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', marginBottom: '16px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#92400E', fontWeight: '500', lineHeight: '1.4' }}>This billboard is awaiting your review before it goes live on the marketplace.</p>
                                </div>
                            )}
                            {billboard.status === 'approved' && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', marginBottom: '16px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#065F46', fontWeight: '500', lineHeight: '1.4' }}>Live and visible to all advertisers on the marketplace.</p>
                                </div>
                            )}
                            {billboard.status === 'rejected' && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', marginBottom: '16px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#92400E', fontWeight: '500', lineHeight: '1.4' }}>Owner has been notified that improvements are required for this listing.</p>
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {cfg.actions.map(a => (
                                    <button key={a.action}
                                        className={a.primary ? 'action-btn approve-btn' : 'action-btn'}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px', 
                                            fontSize: '14px', 
                                            textAlign: 'center', 
                                            justifyContent: 'center', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            background: !a.primary && a.action === 'reject' ? '#FEF3C7' : undefined,
                                            color: !a.primary && a.action === 'reject' ? '#92400E' : undefined,
                                            border: !a.primary && a.action === 'reject' ? 'none' : undefined,
                                            borderRadius: !a.primary && a.action === 'reject' ? '8px' : undefined,
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                        onClick={() => setConfirm({ action: a.action, label: a.label })}>
                                        {a.action === 'approve' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                        {a.action === 'reject'  && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                                        {a.action === 'hide'    && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Owner info */}
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #F3F4F6" }}>
                            <h3>Owner Details</h3>
                            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '16px', border: '1px solid #F3F4F6', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #667B68, #4A5D4C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', flexShrink: 0 }}>
                                        {(billboard.owner?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#111827', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{billboard.owner?.name || 'Unknown'}</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{billboard.owner?.email}</p>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {billboard.owner?.phone_number && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                            <span style={{ color: '#9CA3AF' }}><Phone width={20} height={20} /></span>
                                            <span style={{ fontWeight: '600', color: '#374151' }}>{billboard.owner.phone_number}</span>
                                        </div>
                                    )}
                                    {billboard.owner?.company_name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                            <span style={{ color: '#9CA3AF' }}><Building width={20} height={20} /></span>
                                            <span style={{ fontWeight: '600', color: '#374151' }}>{billboard.owner.company_name}</span>
                                        </div>
                                    )}
                                    {billboard.owner?.address && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                                            <span style={{ color: '#9CA3AF', marginTop: '2px' }}><MapPin width={20} height={20} /></span>
                                            <span style={{ color: '#4B5563', lineHeight: '1.4' }}>{billboard.owner.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {billboard.owner?.id && (
                                <button className="action-btn" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', color: '#4B5563', fontSize: '13px', fontWeight: '600' }}
                                    onClick={() => navigate(`/admin/user/${billboard.owner.id}`)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    View Detailed Account
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm modal */}
            {confirm && (
                <div className="modal-overlay" style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-content" style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', fontSize: '20px', color: '#1F2937' }}>{confirm.label}?</h2>
                        <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
                            {confirm.action === 'approve' && 'This billboard will become visible to all advertisers on the marketplace.'}
                            {confirm.action === 'reject'  && 'The owner will be notified that their listing requires improvements before it can be approved.'}
                            {confirm.action === 'hide'    && "The billboard will be hidden from the marketplace. The owner's account is unaffected."}
                        </p>
                        {confirm.action === 'reject' && (
                            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                    Feedback / Improvement Message <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <textarea
                                    value={confirm.feedbackMessage || ''}
                                    onChange={e => setConfirm({ ...confirm, feedbackMessage: e.target.value })}
                                    placeholder="Explain what the owner needs to change..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', minHeight: '80px', fontSize: '14px', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                    autoFocus
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setConfirm(null)} disabled={actionLoading}
                                style={{ flex: 1, padding: '11px', background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                                Cancel
                            </button>
                            <button onClick={performAction} disabled={actionLoading}
                                className={confirm.action === 'approve' ? 'action-btn approve-btn' : 'action-btn'}
                                style={{ 
                                    flex: 1, 
                                    padding: '11px', 
                                    fontSize: '14px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '8px', 
                                    opacity: actionLoading ? 0.75 : 1, 
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    background: confirm.action === 'approve' ? '#10B981' : confirm.action === 'reject' ? '#F59E0B' : '#6B7280',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700'
                                }}>
                                {actionLoading && <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'abSpin 0.7s linear infinite' }} />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes abSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

export default AdminBillboardDetail;
