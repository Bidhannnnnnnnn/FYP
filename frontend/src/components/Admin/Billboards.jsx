import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminBillboards = () => {
    const [billboards, setBillboards] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBillboards = async () => {
        try {
            const res = await api.get('billboards/my/'); // Based on backend logic where superadmin gets all
            setBillboards(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching billboards", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillboards();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.patch(`billboards/approve/${id}/`, { action });
            alert(`Billboard ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            fetchBillboards();
        } catch (err) {
            console.error("Action failed", err);
            alert("Action failed. Please try again.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '32px', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>Manage Billboards</h1>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Owner</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billboards.length > 0 ? (
                            billboards.map(b => (
                                <tr key={b.id}>
                                    <td>{b.title}</td>
                                    <td>{b.location}</td>
                                    <td>{b.owner?.name || b.owner?.email || 'Unknown'}</td>
                                    <td>
                                        <span className={`status-badge status-${b.status}`}>
                                            {b.status === 'pending' ? 'Pending' : b.status === 'approved' ? 'Approved' : 'Rejected'}
                                        </span>
                                    </td>
                                    <td>
                                        {b.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleAction(b.id, 'approve')} className="action-btn approve-btn">Approve</button>
                                                <button onClick={() => handleAction(b.id, 'reject')} className="action-btn reject-btn">Reject</button>
                                            </div>
                                        )}
                                        {b.status !== 'pending' && <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px', fontWeight: '500' }}>{b.status === 'approved' ? 'Active' : 'Rejected'}</span>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    No billboards found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBillboards;
