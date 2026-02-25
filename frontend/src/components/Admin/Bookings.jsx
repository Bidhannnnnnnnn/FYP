import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            // Admin sees all bookings via owner endpoint if role is superadmin
            // We need to check if 'billboards/my-bookings/' or similar exists for superadmin to see ALL
            // In campaigns/views.py: OwnerBookingsListView (billboards/bookings/) handles this
            const res = await api.get('campaigns/owner-bookings/');
            setBookings(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.patch(`campaigns/bookings/${id}/action/`, { action });
            alert(`Booking ${action}d successfully`);
            fetchBookings();
        } catch (err) {
            console.error(`Failed to ${action} booking`, err);
            alert(`Failed to ${action} booking`);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading bookings...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '32px', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>Manage Bookings</h1>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Campaign / Billboard</th>
                            <th>Advertiser</th>
                            <th>Dates</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? (
                            bookings.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div style={{ fontWeight: '600', color: 'var(--admin-text-dark)' }}>{b.campaign_name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>{b.billboard_details.title}</div>
                                    </td>
                                    <td>{b.advertiser_email}</td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>{b.start_date} to</div>
                                        <div style={{ fontSize: '13px' }}>{b.end_date}</div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'var(--admin-success)' }}>
                                        NRs. {b.price_calculated}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${b.booking_status}`}>
                                            {b.booking_status === 'changes_requested' ? 'Revision' : b.booking_status}
                                        </span>
                                    </td>
                                    <td>
                                        {b.booking_status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleAction(b.id, 'approve')} className="action-btn approve-btn">Approve</button>
                                                <button onClick={() => handleAction(b.id, 'reject')} className="action-btn reject-btn">Reject</button>
                                            </div>
                                        )}
                                        {b.booking_status !== 'pending' && (
                                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px', fontWeight: '500' }}>
                                                {b.booking_status === 'approved' ? 'Active' : b.booking_status === 'changes_requested' ? 'Revision' : 'Rejected'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    No bookings found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBookings;
