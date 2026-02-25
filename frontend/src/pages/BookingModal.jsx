import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import './AdvertiserDashboard.css';

const BookingModal = ({ billboard, onClose, onSuccess, editMode = false, bookingData = null }) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [slotDuration, setSlotDuration] = useState(10);
    const [frequency, setFrequency] = useState(10);
    const [creativeFile, setCreativeFile] = useState(null);

    // Granular Slot State: { 'YYYY-MM-DD': { hour: frequency } }
    const [selectedSlots, setSelectedSlots] = useState({});

    // UI State for tuning
    const [tuningSlot, setTuningSlot] = useState(null); // { date, hour }
    const tuningRef = useRef(null);

    // Pricing & Availability State
    const [estimatedPrice, setEstimatedPrice] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [availabilityData, setAvailabilityData] = useState([]); // Array of slot availability for the range

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

    // Generate dates between start and end
    const dateRange = useMemo(() => {
        if (!startDate || !endDate) return [];
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dates = [];
            let curr = new Date(start);
            while (curr <= end) {
                dates.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }
            return dates;
        } catch (e) {
            return [];
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (editMode && bookingData) {
            setStartDate(bookingData.start_date);
            setEndDate(bookingData.end_date);
            setSlotDuration(bookingData.slot_duration_seconds || 10);
            setFrequency(bookingData.frequency_per_hour || 10);
            setEstimatedPrice(bookingData.price_calculated);

            // Pre-populate granular slots
            if (bookingData.slots && Array.from(bookingData.slots).length > 0) {
                const grouped = {};
                bookingData.slots.forEach(s => {
                    if (!grouped[s.date]) grouped[s.date] = {};
                    grouped[s.date][s.hour] = s.frequency_per_hour;
                });
                setSelectedSlots(grouped);
            }
        }
    }, [editMode, bookingData]);

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

    // Fetch availability for the ENTIRE range whenever dates change
    useEffect(() => {
        if (dateRange.length > 0) {
            fetchAllAvailability();
        }
    }, [dateRange, billboard.id, slotDuration, frequency]);

    const fetchAllAvailability = async () => {
        try {
            const allRangeSlots = [];
            dateRange.forEach(date => {
                allRangeSlots.push({ date, hours: Array.from({ length: 24 }, (_, i) => i) });
            });

            const res = await api.post('campaigns/check-availability/', {
                billboard_id: billboard.id,
                slots: allRangeSlots,
                slot_duration: slotDuration,
                frequency: frequency
            });
            setAvailabilityData(res.data.slots || []);
        } catch (error) {
            console.error("Total availability fetch failed", error);
        }
    };

    // Real-time Pricing Updates
    useEffect(() => {
        if (formattedSlots.length > 0) {
            calculatePrice();
        } else {
            setEstimatedPrice(0);
        }
    }, [formattedSlots, slotDuration, billboard.id]);


    const calculatePrice = async () => {
        setCalculating(true);
        try {
            const res = await api.post('campaigns/calculate-price/', {
                billboard_id: billboard.id,
                slots: formattedSlots,
                slot_duration: slotDuration,
                frequency: frequency
            });
            setEstimatedPrice(res.data.estimated_price);
        } catch (error) {
            console.error("Price calculation failed", error);
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async () => {

        setLoading(true);
        const formData = new FormData();
        formData.append('billboard', billboard.id);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('slot_duration_seconds', slotDuration);
        formData.append('frequency_per_hour', frequency);
        formData.append('slots', JSON.stringify(formattedSlots));
        if (creativeFile) {
            formData.append('creative_file', creativeFile);
        }

        try {
            if (editMode) {
                await api.patch(`campaigns/bookings/${bookingData.id}/update/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Revision Submitted Successfully!');
            } else {
                await api.post('campaigns/bookings/create/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Booking Successful!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Operation failed", error);
            const errorData = error.response?.data;
            let errorMsg = 'Failed: ';
            if (errorData?.detail) {
                errorMsg += errorData.detail;
            } else if (typeof errorData === 'object') {
                errorMsg += Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
            }
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Calculations for UI
    const requestedLoad = slotDuration * frequency;
    const getSlotAvailabilityStatus = (date, hour) => {
        const slot = availabilityData.find(s => s.date === date && s.hour === hour);
        if (!slot) return 0;
        return slot.remaining_seconds;
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
                    [date]: { ...dateSlots, [hour]: frequency }
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
                    if (remaining >= (slotDuration * frequency)) {
                        fullDay[i] = frequency;
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

    // Total Hours for Summary
    const totalHoursSelected = formattedSlots.reduce((acc, curr) => acc + curr.hours.length, 0);

    if (!billboard) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Book {billboard.title}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Heatmap Scheduler */}
                    {dateRange.length > 0 ? (
                        <div style={{ marginBottom: '25px', padding: '15px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>Hourly Availability (Heatmap)</span>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#F4F7F5', border: '1px solid #ddd' }}></div>Available</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#FEF2F2', border: '1px solid #fee2e2' }}></div>Full</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#667B68' }}></div>Your Set</div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px' }}></th>
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <th key={i} style={{ fontSize: '8px', color: '#9CA3AF' }}>{i}h</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dateRange.map(date => (
                                            <tr key={date}>
                                                <td style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                    {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </td>
                                                {Array.from({ length: 24 }).map((_, hour) => {
                                                    const freq = selectedSlots[date]?.[hour];
                                                    const isSelected = freq !== undefined;
                                                    const remaining = getSlotAvailabilityStatus(date, hour);
                                                    const isFull = remaining < (slotDuration * (freq || frequency));

                                                    return (
                                                        <td
                                                            key={hour}
                                                            onClick={() => !isFull && toggleHour(date, hour)}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                if (isSelected) setTuningSlot({ date, hour });
                                                            }}
                                                            style={{
                                                                height: '24px',
                                                                borderRadius: '2px',
                                                                cursor: isFull ? 'not-allowed' : 'pointer',
                                                                border: isSelected ? '1px solid #111' : '1px solid #E5E7EB',
                                                                background: isSelected ? '#667B68' : (isFull ? '#FEF2F2' : getVisibilityColor(hour)),
                                                                title: `${TIME_LABELS[hour]} - ${remaining}s avail`
                                                            }}
                                                        >
                                                            {isSelected && <div style={{ fontSize: '8px', color: '#fff', textAlign: 'center' }}>{freq}x</div>}
                                                        </td>
                                                    );
                                                })}
                                                <td>
                                                    <button onClick={() => toggleFullDay(date)} style={{ fontSize: '9px', padding: '2px 4px', cursor: 'pointer' }}>
                                                        {Object.keys(selectedSlots[date] || {}).length === 24 ? 'Clr' : 'All'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '8px' }}>Right-click selected slots to tune frequency. Total {totalHoursSelected} slots selected.</p>

                            {tuningSlot && (
                                <div ref={tuningRef} style={{
                                    position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
                                    background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, width: '200px'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px' }}>Tune: {tuningSlot.date} {tuningSlot.hour}h</h4>
                                    <input
                                        type="range" min="1" max="60"
                                        value={selectedSlots[tuningSlot.date][tuningSlot.hour]}
                                        onChange={(e) => updateSlotFrequency(tuningSlot.date, tuningSlot.hour, e.target.value)}
                                        style={{ width: '100%', accentColor: '#667B68' }}
                                    />
                                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px' }}>{selectedSlots[tuningSlot.date][tuningSlot.hour]}x per hr</div>
                                    <button onClick={() => setTuningSlot(null)} style={{ width: '100%', marginTop: '10px', fontSize: '11px', padding: '5px' }}>Done</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '30px', textAlign: 'center', background: '#F9FAFB', border: '1px dashed #ddd', borderRadius: '12px', marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', color: '#6B7280' }}>Select start and end dates to see availability.</p>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Slot Duration</span>
                            <span style={{ fontWeight: 600 }}>{slotDuration} sec</span>
                        </label>
                        <input
                            type="range" min="10" max="60" step="5"
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(Number(e.target.value))}
                            style={{ accentColor: '#667B68' }}
                        />
                        <div className="range-labels"><span>10s</span><span>60s</span></div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Frequency</span>
                            <span style={{ fontWeight: 600 }}>{frequency} times/hr</span>
                        </label>
                        <input
                            type="range" min="5" max="60" step="1"
                            value={frequency}
                            onChange={(e) => setFrequency(Number(e.target.value))}
                            style={{ accentColor: '#667B68' }}
                        />
                        <div className="range-labels"><span>5x</span><span>60x</span></div>
                    </div>

                    <div className="form-group">
                        <label>Upload Creative (Optional)</label>
                        <div style={{
                            border: '2px dashed #D1D5DB',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            background: '#F9FAFB',
                            position: 'relative',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            marginTop: '8px'
                        }}>
                            {creativeFile ? (
                                <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                                    {creativeFile.type.startsWith('video/') ? (
                                        <video
                                            src={URL.createObjectURL(creativeFile)}
                                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                            controls
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(creativeFile)}
                                            alt="Preview"
                                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                        />
                                    )}
                                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6B7280' }}>
                                        {creativeFile.name} ({(creativeFile.size / (1024 * 1024)).toFixed(2)} MB)
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>📂</div>
                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Drop your ad here or click to browse</div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>MP4, MOV, JPG, PNG (Max 50MB)</div>
                                </>
                            )}
                            <input
                                type="file"
                                onChange={(e) => setCreativeFile(e.target.files[0])}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    <div className="price-estimation" style={{ marginTop: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: '#374151' }}>Estimated Cost</span>
                        {calculating ? (
                            <span style={{ color: '#6B7280' }}>Calculating...</span>
                        ) : (
                            <span style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>NRs. {estimatedPrice || '0.00'}</span>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        disabled={!startDate || !endDate || loading || totalHoursSelected === 0}
                        onClick={handleSubmit}
                        style={{ opacity: (loading || totalHoursSelected === 0) ? 0.6 : 1, cursor: (loading || totalHoursSelected === 0) ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Processing...' : (editMode ? 'Submit Revision' : 'Confirm Booking')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
