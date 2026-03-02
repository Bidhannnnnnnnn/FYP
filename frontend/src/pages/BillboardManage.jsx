import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css';

const BillboardManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [billboard, setBillboard] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [imagePreview, setImagePreview] = useState(null);

    // Fetch Data
    useEffect(() => {
        fetchBillboardData();
    }, [id]);

    const fetchBillboardData = async () => {
        try {
            const [bbRes, bookingsRes] = await Promise.all([
                api.get(`billboards/detail/${id}/`),
                api.get('campaigns/owner-bookings/')
            ]);

            setBillboard(bbRes.data);

            // Filter bookings for this billboard
            const thisBillboardBookings = bookingsRes.data.filter(b => b.billboard === parseInt(id));
            setBookings(thisBillboardBookings);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching billboard data", error);
            alert("Failed to load billboard data.");
            navigate('/dashboard', { state: { activeTab: 'billboards' } });
        }
    };

    const handleBack = () => {
        navigate('/dashboard', { state: { activeTab: 'billboards' } });
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this billboard? This action cannot be undone.")) return;
        try {
            await api.delete(`billboards/delete/${id}/`);
            alert('Billboard deleted successfully.');
            navigate('/dashboard', { state: { activeTab: 'billboards' } });
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete billboard.");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'image') {
                if (formData.image instanceof File) data.append('image', formData.image);
            } else {
                data.append(key, formData[key]);
            }
        });

        try {
            await api.patch(`billboards/update/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Billboard updated successfully!');
            setShowEditModal(false);
            fetchBillboardData();
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update billboard.");
        }
    };

    const openEditModal = () => {
        setFormData({
            title: billboard.title,
            location: billboard.location,
            base_price: billboard.base_price,
            size: billboard.size,
            display_type: billboard.display_type,
            visibility_score: billboard.visibility_score,
            traffic_density: billboard.traffic_density,
            description: billboard.description,
            latitude: billboard.latitude,
            longitude: billboard.longitude
        });
        setImagePreview(billboard.image);
        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setFormData({ ...formData, image: file });
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    if (loading) return <div className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    if (!billboard) return null;

    // Derived Stats
    const activeBookings = bookings.filter(b => ['approved', 'active', 'paid'].includes(b.booking_status));
    const pendingBookings = bookings.filter(b => b.booking_status === 'pending');

    return (
        <div className="view-container">
            {/* Top Bar */}
            <div style={{ background: '#fff', padding: '15px 0', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#374151', fontWeight: 600, fontSize: '14px' }}
                    >
                        <span>←</span> Back
                    </button>
                    <div style={{ height: '24px', width: '1px', background: '#E5E7EB' }}></div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1F2937' }}>{billboard.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                            <span>📍 {billboard.location}</span>
                            <span>•</span>
                            <span style={{ color: billboard.status === 'approved' ? '#059669' : '#D97706', fontWeight: 500 }}>
                                {billboard.status.charAt(0).toUpperCase() + billboard.status.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => window.open(`/billboard/${id}/player`, '_blank')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👁️</span> Preview
                    </button>
                    <button onClick={openEditModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✏️</span> Edit
                    </button>
                    <button onClick={handleDelete} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ width: '100%' }}>

                {/* Hero / Overview Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '30px', marginBottom: '40px' }}>
                    {/* Billboard Visual & Key Specs */}
                    <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #F3F4F6' }}>
                        <div style={{ height: '300px', position: 'relative' }}>
                            <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '20px' }}>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '20px' }}>NRs. {billboard.base_price} <span style={{ fontSize: '14px', fontWeight: 400 }}>/ day</span></div>
                            </div>
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>Dimensions</h4>
                                <p style={{ margin: 0, fontWeight: 600, color: '#1F2937' }}>{billboard.size}</p>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>Display Type</h4>
                                <p style={{ margin: 0, fontWeight: 600, color: '#1F2937' }}>{billboard.display_type}</p>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>Coordinates</h4>
                                <p style={{ margin: 0, color: '#4B5563', fontSize: '14px' }}>{billboard.latitude || 'N/A'}, {billboard.longitude || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>Traffic Density</h4>
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                                    {billboard.traffic_density}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div className="stat-card" style={{ padding: '24px', alignItems: 'center' }}>
                            <div>
                                <h3 className="stat-label">Active Campaigns</h3>
                                <p className="stat-value" style={{ color: '#10B981' }}>{activeBookings.length}</p>
                            </div>
                            <div className="stat-icon-bg" style={{ fontSize: '24px' }}>📢</div>
                        </div>
                        <div className="stat-card" style={{ padding: '24px', alignItems: 'center' }}>
                            <div>
                                <h3 className="stat-label">Pending Requests</h3>
                                <p className="stat-value" style={{ color: '#F59E0B' }}>{pendingBookings.length}</p>
                            </div>
                            <div className="stat-icon-bg" style={{ fontSize: '24px' }}>⏳</div>
                        </div>
                        <div className="stat-card" style={{ padding: '24px', alignItems: 'center' }}>
                            <div>
                                <h3 className="stat-label">Total Revenue</h3>
                                <p className="stat-value">NRs 0</p>
                            </div>
                            <div className="stat-icon-bg" style={{ fontSize: '24px' }}>💰</div>
                        </div>
                    </div>
                </div>

                {/* Schedule Section */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1F2937' }}>Active Schedule</h3>
                        {/* <button className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>View Full Calendar</button> */}
                    </div>

                    {activeBookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                            <p style={{ fontSize: '18px', marginBottom: '8px' }}>📅</p>
                            <p>No active bookings for this billboard.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {activeBookings.map(b => (
                                <div key={b.id} style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', alignItems: 'center', transition: 'box-shadow 0.2s' }} className="table-row-hover">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6',
                                            border: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {b.creative_file ? (
                                                b.creative_file.match(/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i) ? (
                                                    <video src={b.creative_file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                ) : (
                                                    <img src={b.creative_file} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )
                                            ) : (
                                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>No Ad</span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{b.campaign_name || `Booking #${b.id}`}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280' }}>By {b.advertiser_email}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#6B7280' }}>
                                            <span>📅 {b.start_date} → {b.end_date}</span>
                                            <span>⏱️ {b.slot_duration_seconds}s</span>
                                            <span>🔄 {b.frequency_per_hour}x/hr</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>NRs. {b.price_calculated}</div>
                                        <span style={{ fontSize: '11px', background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>PAID</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Modal (Reused) */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Edit Billboard Details</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-group"><label>Title</label><input name="title" value={formData.title} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>Location</label><input name="location" value={formData.location} onChange={handleInputChange} required /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Rate (NRs)</label><input name="base_price" type="number" value={formData.base_price} onChange={handleInputChange} required /></div>
                                <div className="form-group"><label>Size</label><input name="size" value={formData.size} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillboardManage;
