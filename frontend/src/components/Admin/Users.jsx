import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../Pagination';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'appeals'
    const [suspendModal, setSuspendModal] = useState({ show: false, userId: null, reason: '' });
    const [appealModal, setAppealModal] = useState({ show: false, appealId: null, status: '', note: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [historyModal, setHistoryModal] = useState({ show: false, userId: null });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, appealsRes] = await Promise.all([
                api.get('user/userlist/'),
                api.get('user/manage-appeals/')
            ]);
            setUsers(usersRes.data);
            setAppeals(appealsRes.data);
        } catch (err) {
            console.error("Error fetching admin user data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
        try {
            await api.delete(`user/user-manage/${userId}/`);
            showToast('User deleted successfully');
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to delete user", error);
            showToast("Failed to delete user. Please try again.", 'error');
        }
    };

    const handleSuspendSubmit = async () => {
        try {
            await api.post(`user/ban/${suspendModal.userId}/`, { ban_reason: suspendModal.reason });
            showToast('User suspended successfully');
            setSuspendModal({ show: false, userId: null, reason: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to suspend user", error);
            showToast("Failed to suspend user.", 'error');
        }
    };

    const handleUnsuspend = async (userId) => {
        if (!window.confirm("Restore this user's account access?")) return;
        try {
            await api.post(`user/unban/${userId}/`);
            showToast('User unsuspended successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to unsuspend user", error);
            showToast("Failed to unsuspend user.", 'error');
        }
    };

    const handleRespondAppeal = async (appealId, status, responseText) => {
        try {
            await api.post(`user/manage-appeals/${appealId}/`, {
                status: status,
                admin_response: responseText
            });
            showToast(`Appeal ${status} successfully`);
            fetchData();
        } catch (error) {
            console.error("Failed to respond to appeal", error);
            showToast("Failed to respond to appeal.", 'error');
        }
    };

    // Pagination logic for users - must be before conditional returns
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return users.slice(startIndex, startIndex + itemsPerPage);
    }, [users, currentPage, itemsPerPage]);

    if (loading) return <div>Loading...</div>;

    // Group Appeals By User
    const groupedAppeals = appeals.reduce((acc, appeal) => {
        if (!acc[appeal.user]) {
            acc[appeal.user] = {
                user_id: appeal.user,
                user_name: appeal.user_name,
                user_email: appeal.user_email,
                history: []
            };
        }
        acc[appeal.user].history.push(appeal);
        return acc;
    }, {});

    const sortedUserGroups = Object.values(groupedAppeals).sort((a, b) => {
        return new Date(b.history[0].created_at) - new Date(a.history[0].created_at);
    });

    return (
        <div style={{ paddingBottom: '40px' }}>
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
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={{ 
                        background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                        color: activeTab === 'users' ? '#10B981' : '#6B7280',
                        borderBottom: activeTab === 'users' ? '2px solid #10B981' : '2px solid transparent'
                    }}
                >
                    All Users
                </button>
                <button 
                    onClick={() => setActiveTab('appeals')}
                    style={{ 
                        background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: activeTab === 'appeals' ? '#10B981' : '#6B7280',
                        borderBottom: activeTab === 'appeals' ? '2px solid #10B981' : '2px solid transparent'
                    }}
                >
                    Ban Appeals
                    {appeals.filter(a => a.status === 'pending').length > 0 && (
                        <span style={{ background: '#EF4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
                            {appeals.filter(a => a.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            <div className="admin-table-container">
                {activeTab === 'users' && (
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
                        {paginatedUsers.length > 0 ? (
                            paginatedUsers.map(u => (
                                <tr key={u.id}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--admin-text-dark)' }}>{u.name}</div>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)' }}>{u.email}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span className={`status-badge ${u.role === 'superadmin' ? 'status-admin' : 'status-user'}`} style={{ padding: '6px 12px', letterSpacing: '0.02em' }}>
                                                {u.role === 'superadmin' ? 'Super Admin' : u.role === 'business' ? 'Billboard Owner' : 'User'}
                                            </span>
                                            {u.is_active === false && (
                                                <span style={{ fontSize: '11px', fontWeight: '700', background: '#FEE2E2', color: '#DC2626', padding: '4px 8px', borderRadius: '12px' }}>
                                                    SUSPENDED
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => navigate(`/admin/user/${u.id}`)}
                                                className="action-btn"
                                                style={{ background: 'var(--admin-bg-color)', color: 'var(--admin-text-muted)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                                            >
                                                View
                                            </button>
                                            
                                            {u.role !== 'superadmin' && (
                                                <>
                                                    {u.is_active === false ? (
                                                        <button
                                                            onClick={() => handleUnsuspend(u.id)}
                                                            className="action-btn"
                                                            style={{ background: '#D1FAE5', color: '#059669', padding: '8px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                                        >
                                                            Unsuspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSuspendModal({ show: true, userId: u.id, reason: '' })}
                                                            className="action-btn"
                                                            style={{ background: '#FEF3C7', color: '#D97706', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FDE68A', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                                        >
                                                            Suspend
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="action-btn"
                                                        style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FECACA', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
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
                )}

                {/* Pagination for Users Tab */}
                {activeTab === 'users' && users.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={users.length}
                    />
                )}

                {/* Appeals Tab */}
                {activeTab === 'appeals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sortedUserGroups.length > 0 ? sortedUserGroups.map(group => {
                            const latestAppeal = group.history[0];
                            return (
                                <div key={group.user_id} style={{ 
                                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', 
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', gap: '24px', alignItems: 'center' 
                                }}>
                                    {/* Left: User Info */}
                                    <div style={{ flex: '0 0 250px', borderRight: '1px solid #E5E7EB', paddingRight: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontWeight: 'bold', fontSize: '18px' }}>
                                                {(group.user_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>{group.user_name || `User ID: ${group.user_id}`}</div>
                                                {group.user_email && <div style={{ fontSize: '13px', color: '#6B7280', wordBreak: 'break-all' }}>{group.user_email}</div>}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                            Total Previous Appeals: <strong style={{ color: '#374151' }}>{group.history.length}</strong>
                                        </div>
                                    </div>

                                    {/* Middle: Latest Appeal */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                                                Latest Appeal: {new Date(latestAppeal.created_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ 
                                                fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px',
                                                background: latestAppeal.status === 'pending' ? '#FEF3C7' : (latestAppeal.status === 'approved' ? '#D1FAE5' : '#FEE2E2'),
                                                color: latestAppeal.status === 'pending' ? '#D97706' : (latestAppeal.status === 'approved' ? '#059669' : '#DC2626')
                                            }}>
                                                {latestAppeal.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#374151', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                "{latestAppeal.appeal_text}"
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {latestAppeal.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => setAppealModal({ show: true, appealId: latestAppeal.id, status: 'approved', note: '' })}
                                                    style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'opacity 0.2s' }}
                                                    onMouseEnter={e => e.target.style.opacity = '0.9'} onMouseLeave={e => e.target.style.opacity = '1'}
                                                >Approve</button>
                                                <button 
                                                    onClick={() => setAppealModal({ show: true, appealId: latestAppeal.id, status: 'rejected', note: '' })}
                                                    style={{ background: '#DC2626', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'opacity 0.2s' }}
                                                    onMouseEnter={e => e.target.style.opacity = '0.9'} onMouseLeave={e => e.target.style.opacity = '1'}
                                                >Reject</button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => setHistoryModal({ show: true, userId: group.user_id })}
                                            style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'background 0.2s', marginTop: latestAppeal.status === 'pending' ? '0' : 'auto' }}
                                            onMouseEnter={e => e.target.style.background = '#E5E7EB'} onMouseLeave={e => e.target.style.background = '#F3F4F6'}
                                        >View History</button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', border: '1px dashed #D1D5DB', borderRadius: '12px', background: '#fff' }}>No appeals found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Suspend Modal */}
            {suspendModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#111827' }}>Suspend User</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4B5563' }}>Please provide a reason for suspending this user.</p>
                        <textarea
                            value={suspendModal.reason}
                            onChange={(e) => setSuspendModal({...suspendModal, reason: e.target.value})}
                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '24px', resize: 'vertical' }}
                            placeholder="Violation of policy..."
                            rows={4}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setSuspendModal({show: false, userId: null, reason: ''})}
                                style={{ padding: '10px 16px', background: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                            >Cancel</button>
                            <button 
                                onClick={handleSuspendSubmit}
                                style={{ padding: '10px 16px', background: '#D97706', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white' }}
                            >Suspend User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appeal Response Modal */}
            {appealModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '20px' }}>Respond to Appeal</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4B5563' }}>
                            You are about to <strong style={{ color: appealModal.status === 'approved' ? '#059669' : '#DC2626' }}>{appealModal.status.toUpperCase()}</strong> this appeal. Please provide a message for the user.
                        </p>
                        <textarea
                            value={appealModal.note}
                            onChange={(e) => setAppealModal({...appealModal, note: e.target.value})}
                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '24px', resize: 'vertical', fontSize: '14px' }}
                            placeholder={appealModal.status === 'approved' ? "Your account has been reinstated because..." : "Your appeal was rejected because..."}
                            rows={4}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setAppealModal({ show: false, appealId: null, status: '', note: '' })}
                                style={{ padding: '10px 16px', background: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                            >Cancel</button>
                            <button 
                                onClick={() => {
                                    handleRespondAppeal(appealModal.appealId, appealModal.status, appealModal.note);
                                    setAppealModal({ show: false, appealId: null, status: '', note: '' });
                                }}
                                disabled={appealModal.status === 'approved' && !appealModal.note.trim()}
                                style={{ 
                                    padding: '10px 16px', 
                                    background: appealModal.status === 'approved' ? '#10B981' : '#DC2626', 
                                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white',
                                    opacity: (appealModal.status === 'approved' && !appealModal.note.trim()) ? 0.6 : 1
                                }}
                            >Confirm {appealModal.status === 'approved' ? 'Approval' : 'Rejection'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Appeal History Modal */}
            {historyModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#F9FAFB', padding: '0', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: '20px' }}>User Appeal History</h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                                    All administrative actions recorded for this user.
                                </p>
                            </div>
                            <button 
                                onClick={() => setHistoryModal({ show: false, userId: null })}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9CA3AF' }}
                            >×</button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {appeals.filter(a => a.user === historyModal.userId).map(hist => (
                                <div key={hist.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{new Date(hist.created_at).toLocaleString()}</span>
                                        <span style={{ 
                                            fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px',
                                            background: hist.status === 'pending' ? '#FEF3C7' : (hist.status === 'approved' ? '#D1FAE5' : '#FEE2E2'),
                                            color: hist.status === 'pending' ? '#D97706' : (hist.status === 'approved' ? '#059669' : '#DC2626')
                                        }}>
                                            {hist.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                                        <strong style={{ color: '#111827', display: 'block', marginBottom: '4px' }}>Appeal Message:</strong>
                                        {hist.appeal_text}
                                    </div>
                                    {hist.admin_response && (
                                        <div style={{ fontSize: '14px', color: '#4B5563', padding: '12px', background: '#F3F4F6', borderRadius: '8px', borderLeft: '3px solid #9CA3AF' }}>
                                            <strong style={{ color: '#111827', display: 'block', marginBottom: '4px' }}>Admin Decision:</strong>
                                            {hist.admin_response}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminUsers;
