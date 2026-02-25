import React, { useMemo } from 'react';

const TIME_LABELS = Array.from({ length: 24 }).map((_, i) =>
    `${i.toString().padStart(2, '0')}:00`
);

const getVisibilityColor = (hour) => {
    if (hour >= 8 && hour <= 20) return '#FEF3C7'; // Peak
    if (hour >= 6 && hour <= 23) return '#E0F2FE'; // Mid
    return '#F3F4F6'; // Low
};

const BookingDetailsModal = ({ booking, onClose }) => {
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

    if (!booking) return null;

    const {
        billboard_details,
        campaign_name,
        advertiser_email,
        start_date,
        end_date,
        price_calculated,
        slot_duration_seconds,
        frequency_per_hour,
        slots,
        booking_status,
        owner_remarks,
        creative_file
    } = booking;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div className="modal-content" style={{
                background: '#fff', borderRadius: '24px', width: '900px', maxWidth: '95%',
                maxHeight: '90vh', overflowY: 'auto', position: 'relative',
                padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{
                    position: 'absolute', top: '25px', right: '25px', background: '#F3F4F6',
                    border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: '#6B7280'
                }}>×</button>

                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                background: booking_status === 'approved' ? '#DEF7EC' : (booking_status === 'rejected' ? '#FDE8E8' : '#FEF3C7'),
                                color: booking_status === 'approved' ? '#03543F' : (booking_status === 'rejected' ? '#9B1C1C' : '#92400E'),
                                textTransform: 'uppercase', marginBottom: '10px', display: 'inline-block'
                            }}>
                                {booking_status.replace('_', ' ')}
                            </span>
                            <h2 style={{ margin: 0, fontSize: '28px', color: '#111827' }}>{campaign_name || `Booking #${booking.id}`}</h2>
                            <p style={{ margin: '5px 0 0 0', color: '#6B7280' }}>at {billboard_details?.title}, {billboard_details?.location}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#667B68' }}>NRs. {price_calculated}</div>
                            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Total Price Paid/Quoted</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: '700' }}>Engagement Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' }}>Duration</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{start_date} to {end_date}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' }}>Configuration</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{slot_duration_seconds}s @ {frequency_per_hour}x (Global)</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' }}>Advertiser</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{advertiser_email}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' }}>Creative</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#3B82F6' }}>
                                    {creative_file ? (
                                        <a href={creative_file} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>View Asset ↗</a>
                                    ) : 'No file uploaded'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '20px', border: '1px solid #DCFCE7' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px', fontWeight: '700', color: '#166534' }}>Owner/System Remarks</h4>
                        <p style={{ fontSize: '14px', color: '#166534', margin: 0, fontStyle: owner_remarks ? 'normal' : 'italic' }}>
                            {owner_remarks || "No remarks provided for this booking."}
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <h4 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '700' }}>Schedule Heatmap (Selected Slots)</h4>
                    <div style={{ overflowX: 'auto', paddingBottom: '15px' }}>
                        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}></th>
                                    {TIME_LABELS.map((label, i) => (
                                        <th key={i} style={{ fontSize: '9px', color: '#9CA3AF', paddingBottom: '10px', minWidth: '30px' }}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dateRange.map(date => (
                                    <tr key={date}>
                                        <td style={{ fontSize: '12px', fontWeight: '600', color: '#374151', padding: '8px 0', whiteSpace: 'nowrap' }}>
                                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                        </td>
                                        {Array.from({ length: 24 }).map((_, hour) => {
                                            const freq = slotMap[date]?.[hour];
                                            const isSelected = freq !== undefined;
                                            return (
                                                <td
                                                    key={hour}
                                                    style={{
                                                        height: '24px',
                                                        borderRadius: '2px',
                                                        border: isSelected ? '1px solid #111827' : '1px solid #E5E7EB',
                                                        background: isSelected ? '#667B68' : getVisibilityColor(hour),
                                                        opacity: isSelected ? 1 : 0.3,
                                                        padding: 0
                                                    }}
                                                    title={`${date} ${TIME_LABELS[hour]}${isSelected ? `: ${freq}x Frequency` : ''}`}
                                                >
                                                    {isSelected && (
                                                        <div style={{ color: '#fff', fontSize: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                                            {freq}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
