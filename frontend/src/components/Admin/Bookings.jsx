import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Ban, CheckCircle, ClipboardList, Edit2, Flag, Trash2 } from 'lucide-react';
import Pagination from '../Pagination';

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const IconEye   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconEdit  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Status metadata for resolved bookings ──────────────────────────────────
const STATUS_META = {
    approved:          { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: <CheckCircle width={20} height={20} />, label: 'Approved & Active',   desc: 'Running on billboard'        },
    rejected:          { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <Ban width={20} height={20} />, label: 'Rejected',            desc: 'Booking was declined'        },
    completed:         { color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', icon: <Flag width={20} height={20} />, label: 'Completed',           desc: 'Campaign has finished'       },
    changes_requested: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: <Edit2 width={20} height={20} />, label: 'Revision Requested',  desc: 'Awaiting advertiser update'  },
    cancelled:         { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: <Trash2 width={20} height={20} />, label: 'Cancelled',           desc: 'Booking was cancelled'       },
};

// ─── Reusable action button ─────────────────────────────────────────────────
const Btn = ({ onClick, style, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '7px 13px', borderRadius: '9px', border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: '700', fontSize: '12px',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'Inter, sans-serif',
            ...style,
        }}
    >
        {children}
    </button>
);

// ─── Component ──────────────────────────────────────────────────────────────
const AdminBookings = () => {
    const [bookings, setBookings]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // booking id currently being acted on
    const [confirm, setConfirm]             = useState(null); // { id, action, label }
    const navigate = useNavigate();

    // Get current user role from localStorage
    const userRole = localStorage.getItem('role')?.trim().toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('campaigns/owner-bookings/');
            setBookings(res.data);
        } catch (err) {
            console.error('Failed to fetch bookings', err);
        } finally {
            setLoading(false);
        }
    };

    const performAction = async () => {
        if (!confirm) return;
        const { id, action } = confirm;
        setActionLoading(id);
        setConfirm(null);
        try {
            await api.patch(`campaigns/bookings/${id}/action/`, { action });
            fetchBookings();
        } catch (err) {
            console.error(`Failed to ${action} booking`, err);
        } finally {
            setActionLoading(null);
        }
    };

    // Pagination logic - must be before conditional returns
    const totalPages = Math.ceil(bookings.length / itemsPerPage);
    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return bookings.slice(startIndex, startIndex + itemsPerPage);
    }, [bookings, currentPage, itemsPerPage]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            Loading bookings…
        </div>
    );

    return (
        <div style={{ paddingBottom: '60px' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-dark)', letterSpacing: '-0.01em' }}>
                        Manage Bookings
                    </h1>
                    <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '16px' }}>
                        Review, approve, and oversee all booking requests.
                    </p>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Pending',   count: bookings.filter(b => b.booking_status === 'pending').length,   color: '#F59E0B' },
                        { label: 'Active',    count: bookings.filter(b => b.booking_status === 'approved').length,  color: '#10B981' },
                        { label: 'Total',     count: bookings.length,                                               color: '#6366F1' },
                    ].map(stat => (
                        <div key={stat.label} style={{ padding: '10px 20px', background: '#fff', borderRadius: '14px', border: '1.5px solid #F3F4F6', textAlign: 'center', minWidth: '80px' }}>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color, fontFamily: 'Outfit, sans-serif' }}>{stat.count}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '24px' }}>Campaign / Billboard</th>
                            <th>Advertiser</th>
                            <th>Dates</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px', minWidth: '300px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBookings.length > 0 ? paginatedBookings.map(b => {
                            const isPending = b.booking_status === 'pending';
                            const meta      = STATUS_META[b.booking_status];
                            const isActing  = actionLoading === b.id;

                            return (
                                <tr key={b.id}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--admin-text-dark)' }}>{b.campaign_name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '3px' }}>{b.billboard_details?.title}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-dark)', fontWeight: '500' }}>{b.advertiser_email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(b.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                            → {new Date(b.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700', color: 'var(--admin-primary-green)', fontSize: '15px' }}>
                                            NRs. {Number(b.platform_commission || 0).toLocaleString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${b.booking_status}`} style={{ padding: '5px 12px', letterSpacing: '0.01em' }}>
                                            {b.booking_status === 'changes_requested' ? 'Revision' : b.booking_status}
                                        </span>
                                    </td>
                                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                                        {isPending ? (
                                            /* ── PENDING: show all decision buttons for owners, view-only for superadmins ── */
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                <Btn
                                                    disabled={isActing}
                                                    onClick={() => navigate(`/admin/booking/${b.id}`)}
                                                    style={{ background: '#F9FAFB', color: '#374151', border: '1.5px solid #E5E7EB' }}
                                                >
                                                    <IconEye /> View Details
                                                </Btn>
                                                {!isSuperAdmin && (
                                                    <>
                                                        <Btn
                                                            disabled={isActing}
                                                            onClick={() => setConfirm({ id: b.id, action: 'approve', label: 'Approve Booking' })}
                                                            style={{ background: '#ECFDF5', color: '#065F46', border: '1.5px solid #A7F3D0' }}
                                                        >
                                                            <IconCheck /> Approve
                                                        </Btn>
                                                        <Btn
                                                            disabled={isActing}
                                                            onClick={() => setConfirm({ id: b.id, action: 'request_changes', label: 'Request Revisions' })}
                                                            style={{ background: '#FFFBEB', color: '#B45309', border: '1.5px solid #FDE68A' }}
                                                        >
                                                            <IconEdit /> Revise
                                                        </Btn>
                                                        <Btn
                                                            disabled={isActing}
                                                            onClick={() => setConfirm({ id: b.id, action: 'reject', label: 'Reject Booking' })}
                                                            style={{ background: '#FEF2F2', color: '#991B1B', border: '1.5px solid #FECACA' }}
                                                        >
                                                            <IconX /> Reject
                                                        </Btn>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            /* ── RESOLVED: view + contextual status chip ── */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                                                <Btn
                                                    onClick={() => navigate(`/admin/booking/${b.id}`)}
                                                    style={{ background: '#F9FAFB', color: '#374151', border: '1.5px solid #E5E7EB' }}
                                                >
                                                    <IconEye /> View
                                                </Btn>
                                                {meta && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        padding: '6px 12px', background: meta.bg,
                                                        border: `1.5px solid ${meta.border}`, borderRadius: '10px'
                                                    }}>
                                                        <span style={{ fontSize: '15px', lineHeight: 1 }}>{meta.icon}</span>
                                                        <div style={{ textAlign: 'left' }}>
                                                            <div style={{ fontSize: '11px', fontWeight: '800', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                {meta.label}
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: meta.color, opacity: 0.75 }}>
                                                                {meta.desc}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}><ClipboardList width={20} height={20} /></div>
                                    <p style={{ margin: 0, color: '#6B7280', fontWeight: '600' }}>No bookings yet</p>
                                    <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '14px' }}>Bookings will appear here once advertisers submit requests.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {bookings.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={bookings.length}
                />
            )}

            {/* ── Confirm Modal ── */}
            {confirm && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '24px', padding: '40px',
                        maxWidth: '400px', width: '90%',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.18)', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '18px', margin: '0 auto 20px',
                            background: confirm.action === 'approve' ? '#ECFDF5' : confirm.action === 'request_changes' ? '#FFFBEB' : '#FEF2F2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
                        }}>
                            {confirm.action === 'approve' ? <CheckCircle width={20} height={20} /> : confirm.action === 'request_changes' ? <Edit2 width={20} height={20} /> : <Ban width={20} height={20} />}
                        </div>
                        <h3 style={{ margin: '0 0 10px', fontFamily: 'Outfit, sans-serif', fontSize: '22px', color: '#111827' }}>
                            {confirm.label}?
                        </h3>
                        <p style={{ margin: '0 0 28px', color: '#6B7280', fontSize: '14px', lineHeight: '1.65' }}>
                            {confirm.action === 'approve'         && 'The advertiser will be notified and the campaign will be marked as active.'}
                            {confirm.action === 'request_changes' && 'The advertiser will be asked to revise their submission before approval.'}
                            {confirm.action === 'reject'          && 'This booking will be declined. The advertiser will be notified.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setConfirm(null)}
                                style={{ flex: 1, padding: '13px', background: '#F9FAFB', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={performAction}
                                style={{
                                    flex: 1, padding: '13px', border: 'none', borderRadius: '14px',
                                    fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#fff',
                                    background: confirm.action === 'approve' ? '#10B981' : confirm.action === 'request_changes' ? '#F59E0B' : '#EF4444'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminBookings;
