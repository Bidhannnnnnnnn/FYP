import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import NotificationBell from '../Notifications/NotificationBell';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingBillboards: 0,
        approvedBillboards: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersRes = await api.get('user/userlist/');
                const billboardsRes = await api.get('billboards/my/'); // Admin can see all in 'my/' logic

                // Safe access to data arrays
                const users = Array.isArray(usersRes.data) ? usersRes.data : [];
                const billboards = Array.isArray(billboardsRes.data) ? billboardsRes.data : [];

                setStats({
                    totalUsers: users.length,
                    pendingBillboards: billboards.filter(b => b.status === 'pending').length,
                    approvedBillboards: billboards.filter(b => b.status === 'approved').length,
                });
            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    const navigate = useNavigate();
    const user = {
        name: localStorage.getItem('name') || 'Admin',
        role: localStorage.getItem('role') || 'superadmin'
    };

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

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1>Platform Overview</h1>
                    <p>Helping you supervise the system with ease.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                    <div style={{ transform: 'translateX(-5px)' }}>
                        <NotificationBell />
                    </div>
                    <div
                        className="profile-avatar"
                        onClick={() => navigate('/profile')}
                        style={{
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '14px'
                        }}
                    >
                        {getInitials(user.name)}
                    </div>
                </div>
            </div>
            <div className="admin-card-grid">
                <div className="admin-stat-card clickable" onClick={() => navigate('/admin/users')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>Total Users</h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-text-muted)' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div className="value">{stats.totalUsers}</div>
                </div>
                <div className="admin-stat-card clickable" onClick={() => navigate('/admin/billboards')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ color: 'var(--admin-warning)' }}>Pending Billboards</h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-warning)' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div className="value">{stats.pendingBillboards}</div>
                </div>
                <div className="admin-stat-card clickable" onClick={() => navigate('/admin/billboards')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ color: 'var(--admin-success)' }}>Approved Billboards</h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-success)' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div className="value">{stats.approvedBillboards}</div>
                </div>
            </div>

            <div className="admin-table-container">
                <h3>System Status</h3>
                <p style={{ color: 'var(--admin-success)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admin-success)' }}></span>
                    The system is running normally. All services are operational.
                </p>
            </div>
        </>
    );
};

export default AdminDashboard;
