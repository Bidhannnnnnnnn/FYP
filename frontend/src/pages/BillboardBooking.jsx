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
        if (hour >= 8 && hour <= 10 || hour >= 16 && hour <= 18) return '#f5e6bfff'; // Peak
        if (hour >= 11 && hour <= 15) return '#d6dee6ff'; // Midday
        return '#ffffff'; // Off-peak
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!id) return;
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

    // Prune selectedSlots when dateRange change (Fixes hidden data leakage/pricing bug)
    useEffect(() => {
        if (dateRange.length > 0) {
            setSelectedSlots(prev => {
                const newSlots = {};
                dateRange.forEach(date => {
                    if (prev[date]) {
                        newSlots[date] = prev[date];
                    }
                });
                if (Object.keys(prev).length !== Object.keys(newSlots).length) {
                    return newSlots;
                }
                return prev;
            });
        }
    }, [dateRange]);

    // Fetch availability for the ENTIRE range whenever dates change
    useEffect(() => {
        if (dateRange.length > 0) {
            fetchAllAvailability();
        }
    }, [dateRange, id, slotDuration, globalFrequency]);

    const fetchAllAvailability = async () => {
        try {
            const allRangeSlots = [];
            dateRange.forEach(date => {
                allRangeSlots.push({ date, hours: Array.from({ length: 24 }, (_, i) => i) });
            });

            const res = await api.post('campaigns/check-availability/', {
                billboard_id: id,
                slots: allRangeSlots,
                slot_duration: slotDuration,
                frequency: globalFrequency
            });
            setAvailabilityData(res.data.slots || []);
        } catch (error) {
            console.error("Total availability fetch failed", error);
        }
    };

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
                    if (remaining >= (slotDuration * globalFrequency) && !checkIsPastOrSoon(date, i)) {
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

    // --- Time Validation Logic ---
    const checkIsPastOrSoon = (dateStr, hour) => {
        const now = new Date();
        const slotDate = new Date(dateStr);
        slotDate.setHours(hour, 0, 0, 0);

        // Slot must be at least 1 hour ahead of current time
        const bufferTime = 60 * 60 * 1000; // 1 hour in MS
        return slotDate.getTime() < (now.getTime() + bufferTime);
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280' }}>
            <div className="animate-pulse">Initializing Booking System...</div>
        </div>
    );

    if (!billboard) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3 style={{ color: '#EF4444', marginBottom: '8px' }}>Billboard not found</h3>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
    );

    const totalHours = formattedSlots.reduce((acc, curr) => acc + curr.hours.length, 0);

    const validateAllSlots = () => {
        for (const date in selectedSlots) {
            for (const hour in selectedSlots[date]) {
                if (checkIsPastOrSoon(date, parseInt(hour))) {
                    return false;
                }
            }
        }
        return true;
    };

    return (
        <div className="view-container" style={{ paddingBottom: '80px' }}>
            {/* Premium Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: '#fff',
                        border: '1.5px solid #E5E7EB',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4B5563',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.color = '#667B68'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563'; }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div>
                    <h1 style={{ fontSize: '32px', color: '#111827', fontFamily: 'Outfit, sans-serif', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                        {editId ? 'Revise Campaign' : 'Schedule Placement'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>
                        <span style={{ color: '#667B68', fontWeight: '700' }}>{billboard.title}</span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span>{billboard.location}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px', alignItems: 'start' }}>

                {/* Left Panel: Configuration & Heatmap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* Step 1: Global Config Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '24px' }}>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Campaign Window</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                                />
                                <span style={{ color: '#D1D5DB' }}>→</span>
                                <input
                                    type="date"
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
                                <span style={{ color: '#667B68', fontWeight: '800', fontSize: '14px' }}>{slotDuration}s</span>
                            </div>
                            <input type="range" min="10" max="60" step="5" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '10px', appearance: 'none', cursor: 'pointer', accentColor: '#667B68' }} />
                        </div>

                        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</label>
                                <span style={{ color: '#667B68', fontWeight: '800', fontSize: '14px' }}>{globalFrequency}x/hr</span>
                            </div>
                            <input type="range" min="1" max="60" step="1" value={globalFrequency} onChange={(e) => setGlobalFrequency(Number(e.target.value))} style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '10px', appearance: 'none', cursor: 'pointer', accentColor: '#667B68' }} />
                        </div>
                    </div>

                    {/* Step 2: Heatmap Scheduler */}
                    <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', border: '1.5px solid #F3F4F6', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                        {dateRange.length > 0 ? (
                            <section style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#111827' }}>Daily Performance Heatmap</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { label: 'Prime', color: '#fffbf0', border: '#fef3c7' },
                                            { label: 'Full', color: '#fef2f2', border: '#fee2e2' },
                                            { label: 'Blocked', color: '#f3f4f6', border: '#e5e7eb' },
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
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dateRange.map(date => (
                                                    <tr key={date}>
                                                        <td style={{ fontSize: '13px', fontWeight: '700', color: '#374151', padding: '10px 0' }}>
                                                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                        </td>
                                                        {Array.from({ length: 24 }).map((_, hour) => {
                                                            const freq = selectedSlots[date]?.[hour];
                                                            const isSelected = freq !== undefined;
                                                            const remaining = getSlotAvailabilityStatus(date, hour);
                                                            const isFull = remaining < (slotDuration * (freq || globalFrequency));
                                                            const isRestricted = checkIsPastOrSoon(date, hour);

                                                            return (
                                                                <td
                                                                    key={hour}
                                                                    onClick={() => !isFull && !isRestricted && toggleHour(date, hour)}
                                                                    onContextMenu={(e) => { e.preventDefault(); if (isSelected) setTuningSlot({ date, hour }); }}
                                                                    style={{
                                                                        height: '36px',
                                                                        minWidth: '28px',
                                                                        borderRadius: '7px',
                                                                        cursor: (isFull || isRestricted) ? 'not-allowed' : 'pointer',
                                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        border: isSelected ? '1.5px solid #2d342e' : '1px solid #E5E7EB',
                                                                        background: isSelected ? '#667B68' : (isRestricted ? '#f3f4f6' : (isFull ? '#FEF2F2' : getVisibilityColor(hour))),
                                                                        position: 'relative'
                                                                    }}
                                                                    title={isRestricted ? "Restricted: Past or < 1hr buffer" : `${date} ${TIME_LABELS[hour]}\nAvailable: ${remaining}s`}
                                                                >
                                                                    {isSelected && <div style={{ color: '#fff', fontSize: '10px', fontWeight: '800', textAlign: 'center' }}>{freq}x</div>}
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ paddingLeft: '12px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleFullDay(date)}
                                                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                                                                onMouseOver={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#667B68'; }}
                                                                onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                                                            >
                                                                {Object.keys(selectedSlots[date] || {}).length === 24 ? 'Reset' : 'Fill Day'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '20px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#667B68' }}>💡</span> <strong>Pro Tip:</strong> Right-click an active slot to refine its standalone frequency.
                                </p>

                                {tuningSlot && (
                                    <div ref={tuningRef} style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', padding: '24px', background: '#fff', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.18)', zIndex: 100, border: '1.5px solid #f1f1f1', width: '320px' }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Tuning Slot</h4>
                                        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '24px', fontWeight: '500' }}>{new Date(tuningSlot.date).toLocaleDateString()} at {TIME_LABELS[tuningSlot.hour]}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563' }}>Plays per hour</span>
                                            <span style={{ fontWeight: '800', color: '#667B68' }}>{selectedSlots[tuningSlot.date][tuningSlot.hour]}x</span>
                                        </div>
                                        <input type="range" min="1" max="60" value={selectedSlots[tuningSlot.date][tuningSlot.hour]} onChange={(e) => updateSlotFrequency(tuningSlot.date, tuningSlot.hour, e.target.value)} style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '10px', appearance: 'none', cursor: 'pointer', accentColor: '#667B68' }} />
                                        <button type="button" onClick={() => setTuningSlot(null)} style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Apply Changes</button>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <div style={{ padding: '80px 40px', textAlign: 'center', background: '#F9FAFB', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📅</div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontWeight: '700' }}>Waiting for Timeline</h4>
                                <p style={{ color: '#9CA3AF', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Select a date range above to visualize performance and availability data.</p>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Creative Asset */}
                    <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#111827', marginBottom: '8px' }}>Campaign Creative</h3>
                        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Provide the visual asset for this placement. High-resolution mp4 or jpg preferred.</p>

                        <div style={{ background: '#F9FAFB', padding: '32px', borderRadius: '24px', border: '2px dashed #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667B68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <label style={{ display: 'inline-block', color: '#111827', fontWeight: '700', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline' }}>
                                    Upload Asset
                                    <input type="file" onChange={(e) => setCreativeFile(e.target.files[0])} style={{ display: 'none' }} />
                                </label>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>Max size 100MB • Supports MP4, PNG, JPG</p>
                            </div>
                            {creativeFile && (
                                <div style={{ marginTop: '8px', padding: '10px 20px', background: '#667B68', color: '#fff', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📎 {creativeFile.name}</span>
                                    <button type="button" onClick={() => setCreativeFile(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Summary & Pricing */}
                <div style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', border: '1.5px solid #F3F4F6', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.08)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: '#111827', marginBottom: '24px' }}>Campaign Overview</h3>

                        <div style={{ borderRadius: '20px', overflow: 'hidden', height: '180px', background: '#F3F4F6', marginBottom: '24px', position: 'relative' }}>
                            <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#111827' }}>Preview Asset</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px', borderBottom: '1.5px solid #F3F4F6', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Footprint</span>
                                <span style={{ color: '#111827', fontWeight: '700', fontSize: '15px' }}>{totalHours} Selected Hours</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Duration</span>
                                <span style={{ color: '#111827', fontWeight: '700', fontSize: '15px' }}>{slotDuration} Seconds</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <span style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Estimated Total</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                {calculating ? (
                                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#D1D5DB', fontFamily: 'Outfit, sans-serif' }}>Updating...</span>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '40px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>NRs. {Number(estimatedPrice || 0).toLocaleString()}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => validateAllSlots() ? handleSubmit() : alert("One or more slots have expired (1hr buffer). Please refresh.")}
                            disabled={submitting || totalHours === 0}
                            style={{
                                width: '100%',
                                padding: '20px',
                                borderRadius: '18px',
                                background: totalHours === 0 ? '#F3F4F6' : '#667B68',
                                color: totalHours === 0 ? '#9CA3AF' : '#fff',
                                fontSize: '16px',
                                fontWeight: '800',
                                border: 'none',
                                cursor: (submitting || totalHours === 0) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: totalHours === 0 ? 'none' : '0 10px 25px -5px rgba(102, 123, 104, 0.4)',
                                fontFamily: 'Outfit, sans-serif'
                            }}
                            onMouseOver={(e) => { if (!submitting && totalHours > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { if (!submitting && totalHours > 0) e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {submitting ? 'Processing...' : (editId ? 'Resubmit Campaign' : 'Confirm & Schedule')}
                        </button>

                        <div style={{ background: '#FFF9E6', padding: '16px', borderRadius: '16px', marginTop: '24px', border: '1px solid #FEF3C7', display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '18px' }}>🔐</span>
                            <p style={{ margin: 0, fontSize: '11px', color: '#92400E', lineHeight: '1.4', fontWeight: '500' }}>
                                <strong>Secure Transmission:</strong> Your creative assets and campaign data are encrypted and pending verification by the billboard owner.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillboardBooking;
