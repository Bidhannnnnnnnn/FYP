import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
    const adminName = localStorage.getItem('name') || 'Admin';

    React.useEffect(() => {
        // Check for login toast flag from AuthPage/Login
        if (localStorage.getItem('showLoginToast') === 'true') {
            setToast({
                show: true,
                message: `Logged in as Super Admin`,
                type: 'success'
            });
            localStorage.removeItem('showLoginToast');
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    }, []);

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

    return (
        <div className="admin-container">
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
            <aside className="admin-sidebar">
                <h2 className="brand-name">Bimbasetu</h2>
                <nav>
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/bookings"
                        className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Bookings
                    </NavLink>
                    <NavLink
                        to="/admin/billboards"
                        className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                        Billboards
                    </NavLink>
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Users
                    </NavLink>
                    <NavLink
                        to="/admin/billing"
                        className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Finance & Billing
                    </NavLink>
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
                            to="/admin/profile"
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}
                        >
                            <div style={{ width: '36px', height: '36px', background: '#667B68', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                                AD
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                Super Admin
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
            </aside>
            <main className="admin-main">
                <Outlet />
            </main>

            {showLogoutConfirm && (
                <div className="modal-overlay" style={{ zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ marginBottom: '20px', color: '#EF4444' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: '10px', color: '#1F2937', fontFamily: 'Outfit, sans-serif' }}>Confirm Logout</h2>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>Are you sure you want to log out of the admin panel?</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', color: '#4B5563', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseEnter={(e) => e.target.style.background = '#F9FAFB'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseEnter={(e) => { e.target.style.background = '#DC2626'; e.target.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.target.style.background = '#EF4444'; e.target.style.transform = 'translateY(0)'; }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
