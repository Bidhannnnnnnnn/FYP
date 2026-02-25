import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css';

const BillboardBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse edit ID from query
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get('edit');

    const [billboard, setBillboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [existingBooking, setExistingBooking] = useState(null);

    // Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [slotDuration, setSlotDuration] = useState(10);
    const [globalFrequency, setGlobalFrequency] = useState(10);
    const [creativeFile, setCreativeFile] = useState(null);

    // Granular Slot State: { 'YYYY-MM-DD': { hour: frequency } }
    const [selectedSlots, setSelectedSlots] = useState({});

    // UI State for tuning
    const [tuningSlot, setTuningSlot] = useState(null); // { date, hour }
    const tuningRef = useRef(null);

    // Pricing & Availability State
    const [estimatedPrice, setEstimatedPrice] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [availabilityData, setAvailabilityData] = useState([]); // Array of slot availability for the WHOLE RANGE

    // --- Time Slot Config ---
    const TIME_LABELS = {
        0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
        6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
        12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
        18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM'
    };

    const getVisibilityColor = (hour) => {
        if (hour >= 8 && hour <= 10 || hour >= 16 && hour <= 18) return '#FFF9E6'; // Peak
        if (hour >= 11 && hour <= 15) return '#F4F7F5'; // Midday
        return '#F9FAFB'; // Off-peak
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Billboard
                const boardRes = await api.get(`billboards/detail/${id}/`);
                setBillboard(boardRes.data);

                // 2. If editing, fetch existing booking
                if (editId) {
                    const bookingRes = await api.get('campaigns/bookings/');
                    const booking = bookingRes.data.find(b => b.id === parseInt(editId));
                    if (booking) {
                        setExistingBooking(booking);
                        setStartDate(booking.start_date);
                        setEndDate(booking.end_date);
                        setSlotDuration(booking.slot_duration_seconds);
                        setGlobalFrequency(booking.frequency_per_hour);

                        // Populate slots heatmap
                        if (booking.slots) {
                            const grouped = {};
                            booking.slots.forEach(s => {
                                if (!grouped[s.date]) grouped[s.date] = {};
                                grouped[s.date][s.hour] = s.frequency_per_hour;
                            });
                            setSelectedSlots(grouped);
                        }
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [id, editId]);

    // Generate dates between start and end
    const dateRange = useMemo(() => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];
        let curr = new Date(start);
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, [startDate, endDate]);

    // Fetch availability for the ENTIRE range whenever dates change
    useEffect(() => {
        if (dateRange.length > 0) {
            fetchAllAvailability();
        }
    }, [dateRange, id, slotDuration, globalFrequency]);

    const fetchAllAvailability = async () => {
        try {
            // Request stats for ALL 24 hours of ALL days in range
            const allRangeSlots = [];
            dateRange.forEach(date => {
                allRangeSlots.push({ date, hours: Array.from({ length: 24 }, (_, i) => i) });
            });

            const res = await api.post('campaigns/check-availability/', {
                billboard_id: id,
                slots: allRangeSlots,
                slot_duration: slotDuration,
                frequency: globalFrequency // Just as a baseline check
            });
            setAvailabilityData(res.data.slots || []);
        } catch (error) {
            console.error("Total availability fetch failed", error);
        }
    };

    // Format slots for API submissions
    const formattedSlots = useMemo(() => {
        return Object.entries(selectedSlots)
            .map(([date, hoursObj]) => {
                const hours = Object.entries(hoursObj).map(([h, f]) => ({
                    h: parseInt(h),
                    f: parseInt(f)
                }));
                return hours.length > 0 ? { date, hours } : null;
            })
            .filter(Boolean);
    }, [selectedSlots]);

    // Real-time Pricing Updates
    useEffect(() => {
        if (formattedSlots.length > 0) {
            calculatePrice();
        } else {
            setEstimatedPrice(0);
        }
    }, [formattedSlots, slotDuration, id]);

    const calculatePrice = async () => {
        setCalculating(true);
        try {
            const res = await api.post('campaigns/calculate-price/', {
                billboard_id: id,
                slots: formattedSlots,
                slot_duration: slotDuration,
                frequency: globalFrequency
            });
            setEstimatedPrice(res.data.estimated_price);
        } catch (error) {
            console.error("Price calculation failed", error);
        } finally {
            setCalculating(false);
        }
    };

    const toggleHour = (date, hour) => {
        setSelectedSlots(prev => {
            const dateSlots = prev[date] || {};
            if (dateSlots[hour] !== undefined) {
                const newDateSlots = { ...dateSlots };
                delete newDateSlots[hour];
                return { ...prev, [date]: newDateSlots };
            } else {
                return {
                    ...prev,
                    [date]: { ...dateSlots, [hour]: globalFrequency }
                };
            }
        });
    };

    const toggleFullDay = (date) => {
        setSelectedSlots(prev => {
            const dateSlots = prev[date] || {};
            const allHoursSelected = Object.keys(dateSlots).length === 24;

            if (allHoursSelected) {
                const { [date]: _, ...rest } = prev;
                return rest;
            } else {
                const fullDay = {};
                for (let i = 0; i < 24; i++) {
                    const remaining = getSlotAvailabilityStatus(date, i);
                    if (remaining >= (slotDuration * globalFrequency)) {
                        fullDay[i] = globalFrequency;
                    }
                }
                return { ...prev, [date]: { ...dateSlots, ...fullDay } };
            }
        });
    };

    const updateSlotFrequency = (date, hour, freq) => {
        setSelectedSlots(prev => ({
            ...prev,
            [date]: { ...prev[date], [hour]: freq }
        }));
    };

    const handleSubmit = async () => {
        if (formattedSlots.length === 0) {
            alert("Please select at least one time slot.");
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('billboard', id);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('slot_duration_seconds', slotDuration);
        formData.append('frequency_per_hour', globalFrequency);
        // Backend now handles JSON string in FormData
        formData.append('slots', JSON.stringify(formattedSlots));

        if (creativeFile) {
            formData.append('creative_file', creativeFile);
        }

        try {
            if (editId) {
                await api.patch(`campaigns/bookings/${editId}/update/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Revision Submitted Successfully! Waiting for re-approval.');
            } else {
                await api.post('campaigns/bookings/create/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Booking Successful! Waiting for owner approval.');
            }
            navigate('/advertiser/my-bookings');
        } catch (error) {
            console.error("Booking failed", error);
            const msg = error.response?.data?.error || 'Booking failed.';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getSlotAvailabilityStatus = (date, hour) => {
        const slot = availabilityData.find(s => s.date === date && s.hour === hour);
        if (!slot) return 0; // Unknown
        return slot.remaining_seconds;
    };

    // Close tuning modal on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tuningRef.current && !tuningRef.current.contains(e.target)) {
                setTuningSlot(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) return <div className="p-20 text-center">Loading booking system...</div>;
    if (!billboard) return <div className="p-20 text-center">Billboard not found.</div>;

    const totalHours = formattedSlots.reduce((acc, curr) => acc + curr.hours.length, 0);

    return (
        <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f4f7f5', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <button onClick={() => navigate(-1)} className="back-btn" style={{
                        background: '#fff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '50%',
                        width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>←</button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                            {editId ? 'Revise Your Campaign' : 'Advanced Campaign Scheduler'}
                        </h1>
                        <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                            Booking billboard: <strong>{billboard.title}</strong> {editId && '(Revision Mode)'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>

                    {/* Left Panel */}
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>

                        {/* 1. Global Config */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '25px', marginBottom: '40px', borderBottom: '1px solid #f3f4f6', paddingBottom: '30px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                                    <span>to</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Content Duration</span>
                                    <span style={{ color: '#667B68', fontWeight: '700' }}>{slotDuration}s</span>
                                </label>
                                <input type="range" min="10" max="60" step="5" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} style={{ width: '100%', accentColor: '#667B68' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Frequency</span>
                                    <span style={{ color: '#667B68', fontWeight: '700' }}>{globalFrequency}x / hr</span>
                                </label>
                                <input type="range" min="1" max="60" step="1" value={globalFrequency} onChange={(e) => setGlobalFrequency(Number(e.target.value))} style={{ width: '100%', accentColor: '#667B68' }} />
                            </div>
                        </div>


                        {/* 2. Interactive Heatmap Scheduler */}
                        {dateRange.length > 0 ? (
                            <section style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Hourly Availability & Tuning</h3>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                                        <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#F4F7F5', border: '1px solid #E5E7EB' }}>Available</div>
                                        <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#FEF2F2', border: '1px solid #FEE2E2' }}>Busy/Full</div>
                                        <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#667B68', color: '#fff' }}>Your Selection</div>
                                    </div>
                                </div>

                                <div className="schedule-layer" style={{ padding: '10px', background: '#F9FAFB', borderRadius: '16px' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '100px' }}></th>
                                                    {Array.from({ length: 24 }).map((_, i) => (
                                                        <th key={i} style={{ fontSize: '9px', color: '#9CA3AF', paddingBottom: '10px' }}>{TIME_LABELS[i]}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dateRange.map(date => (
                                                    <tr key={date}>
                                                        <td style={{ fontSize: '12px', fontWeight: '600', color: '#374151', padding: '8px 0' }}>
                                                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                                        </td>
                                                        {Array.from({ length: 24 }).map((_, hour) => {
                                                            const freq = selectedSlots[date]?.[hour];
                                                            const isSelected = freq !== undefined;
                                                            const remaining = getSlotAvailabilityStatus(date, hour);
                                                            const isFull = remaining < (slotDuration * (freq || globalFrequency));
                                                            const occupancyPercent = 1 - (remaining / 3600);
                                                            const maxFreqPossible = Math.floor(remaining / slotDuration);

                                                            return (
                                                                <td
                                                                    key={hour}
                                                                    onClick={() => !isFull && toggleHour(date, hour)}
                                                                    onContextMenu={(e) => {
                                                                        e.preventDefault();
                                                                        if (isSelected) setTuningSlot({ date, hour });
                                                                    }}
                                                                    style={{
                                                                        height: '32px',
                                                                        borderRadius: '4px',
                                                                        cursor: isFull ? 'not-allowed' : 'pointer',
                                                                        transition: 'all 0.1s ease',
                                                                        border: isSelected ? '2px solid #374151' : '1px solid #E5E7EB',
                                                                        background: isSelected ? '#667B68' : (isFull ? '#FEF2F2' : getVisibilityColor(hour)),
                                                                        position: 'relative',
                                                                        opacity: isSelected ? 1 : Math.max(0.3, 1 - occupancyPercent)
                                                                    }}
                                                                    title={`${date} ${TIME_LABELS[hour]}\n- Available: ${remaining}s\n- Max Frequency: ${maxFreqPossible}x`}
                                                                >
                                                                    {isSelected && (
                                                                        <div style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold', textAlign: 'center' }}>
                                                                            {freq}x
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ paddingLeft: '10px' }}>
                                                            <button
                                                                onClick={() => toggleFullDay(date)}
                                                                style={{
                                                                    padding: '4px 8px', fontSize: '10px', borderRadius: '6px',
                                                                    border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {Object.keys(selectedSlots[date] || {}).length === 24 ? 'Reset' : 'All Day'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '15px' }}>
                                    * Right-click any selected hour to tune its specific frequency.
                                </p>

                                {/* Per-Slot frequency tuner (Tooltip/Popover style) */}
                                {tuningSlot && (
                                    <div
                                        ref={tuningRef}
                                        style={{
                                            position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
                                            padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                            zIndex: 100, border: '1px solid #e5e7eb', width: '300px'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Tune Frequency</h4>
                                        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '15px' }}>
                                            {tuningSlot.date} @ {TIME_LABELS[tuningSlot.hour]}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px' }}>Shows per hour</span>
                                            <span style={{ fontWeight: '700', color: '#667B68' }}>{selectedSlots[tuningSlot.date][tuningSlot.hour]}x</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="60"
                                            value={selectedSlots[tuningSlot.date][tuningSlot.hour]}
                                            onChange={(e) => updateSlotFrequency(tuningSlot.date, tuningSlot.hour, e.target.value)}
                                            style={{ width: '100%', accentColor: '#667B68' }}
                                        />

                                        <button
                                            onClick={() => setTuningSlot(null)}
                                            style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <div style={{ padding: '60px', textAlign: 'center', background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
                                <p style={{ color: '#9ca3af' }}>Select a date range to check availability heatmap.</p>
                            </div>
                        )}

                        {/* Creative Upload Section (Moved to bottom) */}
                        <div style={{ marginTop: '40px', padding: '30px', background: '#F9FAFB', borderRadius: '20px', border: '2px dashed #E5E7EB', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Campaign Creative</h3>
                                {creativeFile ? (
                                    <span style={{ padding: '6px 14px', background: '#D1FAE5', color: '#065F46', borderRadius: '50px', fontSize: '12px', fontWeight: 'bold' }}>Ready to Upload</span>
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>Missing Creative *</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '15px', lineHeight: '1.5' }}>
                                        Upload your ad creative (Video/Image). Recommended: 1920x1080 for HD Billboards or 4K for premium displays.
                                    </p>
                                    <label style={{
                                        display: 'inline-block', padding: '12px 24px', background: '#fff', border: '1px solid #D1D5DB',
                                        borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                        Choose File...
                                        <input
                                            type="file"
                                            onChange={(e) => setCreativeFile(e.target.files[0])}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {creativeFile && <span style={{ marginLeft: '15px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>{creativeFile.name}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Summary */}
                    <div style={{ position: 'sticky', top: '40px', height: 'fit-content' }}>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Booking Summary</h3>

                            <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', height: '140px' }}>
                                <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>Total Slots</span>
                                    <span style={{ fontWeight: '700' }}>{totalHours} Selected</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>Configuration</span>
                                    <span style={{ fontWeight: '500' }}>{slotDuration}s Duration</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>Visibility Factor</span>
                                    <span style={{ fontWeight: '500', color: '#10B981' }}>Optimized</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '600' }}>Final Price</span>
                                <div style={{ textAlign: 'right' }}>
                                    {calculating ? (
                                        <div style={{ color: '#9ca3af', fontSize: '14px' }}>Calculating...</div>
                                    ) : (
                                        <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>NRs. {estimatedPrice || '0.00'}</div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || totalHours === 0}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                                    background: totalHours === 0 ? '#f3f4f6' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: totalHours === 0 ? '#9ca3af' : '#fff',
                                    boxShadow: totalHours === 0 ? 'none' : '0 10px 20px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                {submitting ? 'Confirming...' : (editId ? 'Submit Revision' : 'Place Booking')}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BillboardBooking;
