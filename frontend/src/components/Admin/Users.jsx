import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('user/userlist/');
                setUsers(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching users", err);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
        try {
            await api.delete(`user/user-manage/${userId}/`);
            alert('User deleted successfully');
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Failed to delete user. Please try again.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-dark)', letterSpacing: '-0.01em' }}>
                        User Management
                    </h1>
                    <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '16px' }}>
                        Manage platform users, roles, and administrative access.
                    </p>
                </div>
            </div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '24px' }}>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--admin-text-dark)' }}>{u.name}</div>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)' }}>{u.email}</td>
                                    <td>
                                        <span className={`status-badge ${u.role === 'superadmin' ? 'status-admin' : 'status-user'}`} style={{ padding: '6px 12px', letterSpacing: '0.02em' }}>
                                            {u.role === 'superadmin' ? 'Super Admin' : u.role === 'business' ? 'Billboard Owner' : 'User'}
                                        </span>
                                    </td>
                                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => navigate(`/admin/user/${u.id}`)}
                                                className="action-btn"
                                                style={{ background: 'var(--admin-bg-color)', color: 'var(--admin-text-muted)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = 'var(--admin-text-dark)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-bg-color)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; }}
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="action-btn"
                                                style={{ background: '#FFFBEB', color: '#B45309', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FDE68A', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#991B1B'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = '#FDE68A'; e.currentTarget.style.color = '#B45309'; }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
