import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Lightbulb } from 'lucide-react';

// 12-hour labels to match booking page
const TIME_LABELS = [
    '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
    '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
];

const getVisibilityColor = (hour) => {
    if ((hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18)) return '#f5e6bfff';
    if (hour >= 11 && hour <= 15) return '#d6dee6ff';
    return '#ffffff';
};

const BookingDetailsView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnerView, setIsOwnerView] = useState(false);

    // Action state
    const [actionLoading, setActionLoading] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [showRemarksFor, setShowRemarksFor] = useState(null); // 'reject' | 'revise' | null

    const fetchBooking = async () => {
        if (!id) return;
        try {
            let found = null;
            try {
                const res = await api.get('campaigns/bookings/');
                found = res.data.find(b => b.id === parseInt(id));
            } catch (e) {}

            if (found) {
                setBooking(found);
                setIsOwnerView(false);
            } else {
                const resOwner = await api.get('campaigns/owner-bookings/');
                const foundOwner = resOwner.data.find(b => b.id === parseInt(id));
                setBooking(foundOwner || null);
                setIsOwnerView(!!foundOwner);
            }
        } catch (error) {
            console.error("Failed to fetch booking details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooking(); }, [id]);

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            await api.patch(`campaigns/bookings/${id}/action/`, { action, remarks });
            setRemarks('');
            setShowRemarksFor(null);
            await fetchBooking();
        } catch (err) {
            alert(err.response?.data?.error || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Reconstruct selected slots for easy lookup in heatmap
    const slotMap = useMemo(() => {
        if (!booking || !booking.slots) return {};
        const map = {};
        booking.slots.forEach(s => {
            if (!map[s.date]) map[s.date] = {};
            map[s.date][s.hour] = s.frequency_per_hour;
        });
        return map;
    }, [booking?.slots]);

    const dateRange = useMemo(() => {
        if (!booking || !booking.start_date || !booking.end_date) return [];
        const dates = [];
        let curr = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, [booking?.start_date, booking?.end_date]);

    if (loading) return <div className="view-container">Loading booking details...</div>;
    if (!booking) return (
        <div className="view-container">
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back
            </button>
            <p>Booking not found. You might not have permission to view this.</p>
        </div>
    );

    const {
        billboard_details,
        campaign_name,
        advertiser_email,
        start_date,
        end_date,
        price_calculated,
        slot_duration_seconds,
        frequency_per_hour,
        booking_status,
        owner_remarks,
        creative_file
    } = booking;

    const isVideo = creative_file?.match(/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i);

    return (
        <div className="view-container">
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content', background: 'transparent', border: '1px solid #E5E7EB', color: '#374151' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back
            </button>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #F3F4F6' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #E5E7EB' }}>
                    <div>
                        <span style={{
                            padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                            background: booking_status === 'approved' ? '#DEF7EC' : (booking_status === 'rejected' ? '#FDE8E8' : '#FEF3C7'),
                            color: booking_status === 'approved' ? '#03543F' : (booking_status === 'rejected' ? '#9B1C1C' : '#92400E'),
                            textTransform: 'uppercase', marginBottom: '16px', display: 'inline-block'
                        }}>
                            {booking_status.replace('_', ' ')}
                        </span>
                        <h2 style={{ margin: 0, fontSize: '32px', color: '#111827', fontWeight: '800' }}>{campaign_name || `Booking #${booking.id}`}</h2>
                        <p style={{ margin: '8px 0 0 0', color: '#6B7280', fontSize: '16px' }}>at {billboard_details?.title}, {billboard_details?.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: '#10B981' }}>NRs. {price_calculated}</div>
                        <div style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Total Price Quoted</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '40px', marginBottom: '40px' }}>
                    {/* Left Col: Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Engagement Details */}
                        <div style={{ background: '#F9FAFB', padding: '30px', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Engagement Details
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Duration</label>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginTop: '4px' }}>{start_date} to {end_date}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Configuration</label>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginTop: '4px' }}>{slot_duration_seconds}s @ {frequency_per_hour}x /hr</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Advertiser</label>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginTop: '4px' }}>{advertiser_email}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Billboard Display</label>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginTop: '4px' }}>{billboard_details?.display_type || 'Digital'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Remarks */}
                        {owner_remarks && (
                            <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '20px', border: '1px solid #DCFCE7' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Owner/System Remarks
                                </h4>
                                <p style={{ fontSize: '15px', color: '#166534', margin: 0, lineHeight: '1.5' }}>
                                    {owner_remarks}
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Right Col: Creative File */}
                    <div style={{ background: '#000', borderRadius: '20px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                        {creative_file ? (
                            isVideo ? (
                                <video src={creative_file} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                            ) : (
                                <img src={creative_file} alt="Ad Creative" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                            )
                        ) : (
                            <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                <div>No creative asset uploaded</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Owner Actions */}
                {isOwnerView && booking_status === 'pending' && (
                    <div style={{ background: '#F9FAFB', borderRadius: '20px', padding: '28px', border: '1.5px solid #E5E7EB', marginBottom: '32px' }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Review this Booking</h4>

                        {showRemarksFor && (
                            <div style={{ marginBottom: '16px' }}>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder={showRemarksFor === 'reject' ? 'Reason for rejection...' : 'What changes are needed?'}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => handleAction('approve')}
                                disabled={actionLoading}
                                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#667B68', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                            >
                                {actionLoading ? '...' : 'Approve'}
                            </button>

                            {showRemarksFor === 'revise' ? (
                                <button
                                    onClick={() => handleAction('request_revision')}
                                    disabled={actionLoading || !remarks.trim()}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#F59E0B', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    {actionLoading ? '...' : 'Send Revision Request'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowRemarksFor('revise')}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #F59E0B', background: '#fff', color: '#B45309', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Request Revision
                                </button>
                            )}

                            {showRemarksFor === 'reject' ? (
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={actionLoading || !remarks.trim()}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    {actionLoading ? '...' : 'Confirm Rejection'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowRemarksFor('reject')}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #EF4444', background: '#fff', color: '#EF4444', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Reject
                                </button>
                            )}

                            {showRemarksFor && (
                                <button
                                    onClick={() => { setShowRemarksFor(null); setRemarks(''); }}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Heatmap Scheduler (Premium Replicated) */}
                <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', border: '1.5px solid #F3F4F6', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                    {dateRange.length > 0 ? (
                        <section style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#111827' }}>Schedule Heatmap</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { label: 'Prime', color: '#fffbf0', border: '#fef3c7' },
                                        { label: 'Full', color: '#fef2f2', border: '#fee2e2' },
                                        // { label: 'Blocked', color: '#f3f4f6', border: '#e5e7eb' },
                                        { label: 'Selected', color: '#667B68', border: '#667B68' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${item.border}`, background: item.color, fontSize: '10px', fontWeight: '700', color: item.color === '#667B68' ? '#fff' : '#6B7280' }}>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '20px', border: '1px solid #f1f1f1' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '110px' }}></th>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <th key={i} style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600', paddingBottom: '12px' }}>{TIME_LABELS[i]}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dateRange.map(date => (
                                                <tr key={date}>
                                                    <td style={{ fontSize: '13px', fontWeight: '700', color: '#374151', padding: '10px 0' }}>
                                                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </td>
                                                    {Array.from({ length: 24 }).map((_, hour) => {
                                                        const freq = slotMap[date]?.[hour];
                                                        const isSelected = freq !== undefined;

                                                        return (
                                                            <td
                                                                key={hour}
                                                                style={{
                                                                    height: '36px',
                                                                    minWidth: '28px',
                                                                    borderRadius: '7px',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    border: isSelected ? '1.5px solid #2d342e' : '1px solid #E5E7EB',
                                                                    background: isSelected ? '#667B68' : getVisibilityColor(hour),
                                                                    position: 'relative',
                                                                    cursor: 'default'
                                                                }}
                                                                title={`${date} ${TIME_LABELS[hour]}${isSelected ? `\nPlays: ${freq}x` : ''}`}
                                                            >
                                                                {isSelected && <div style={{ color: '#fff', fontSize: '10px', fontWeight: '800', textAlign: 'center' }}>{freq}x</div>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '20px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#667B68' }}><Lightbulb width={20} height={20} /></span> <strong>Insight:</strong> The heatmap visualizes the exact timeline of your advertisement plays as per the finalized booking.
                            </p>
                        </section>
                    ) : (
                        <div style={{ padding: '80px 40px', textAlign: 'center', background: '#F9FAFB', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}><Calendar width={20} height={20} /></div>
                            <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontWeight: '700' }}>No Timeline Data</h4>
                            <p style={{ color: '#9CA3AF', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Wait for the booking details to load or verify the date range for this campaign.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default BookingDetailsView;
