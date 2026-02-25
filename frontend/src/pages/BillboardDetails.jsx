import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdvertiserDashboard.css';

const BillboardDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [billboard, setBillboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBillboard = async () => {
            try {
                const res = await api.get(`billboards/detail/${id}/`);
                setBillboard(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch billboard", err);
                setError(err.response?.status === 404 ? "Billboard not found." : "Failed to load details.");
                setLoading(false);
            }
        };
        fetchBillboard();
    }, [id]);

    if (loading) return <div className="p-20 text-center">Loading details...</div>;
    if (error) return <div className="p-20 text-center text-red-500">{error}</div>;
    if (!billboard) return null;

    return (
        <div className="billboard-details-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#666' }}>
                ← Back to Dashboard
            </button>

            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px' }}>

                {/* Left Column: Visuals & Info */}
                <div className="details-main">
                    <div className="hero-image-container" style={{ width: '100%', height: '400px', background: '#e0e0e0', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                        {billboard.image ? (
                            <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                No Image Available
                            </div>
                        )}
                    </div>

                    <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>{billboard.title}</h1>
                    <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>📍 {billboard.location}</p>

                    <div className="specs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
                        <div>
                            <span style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Display Type</span>
                            <span style={{ fontWeight: '600' }}>{billboard.display_type || 'Digital'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Size</span>
                            <span style={{ fontWeight: '600' }}>{billboard.size || 'Standard'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Traffic Density</span>
                            <span style={{ fontWeight: '600' }}>{billboard.traffic_density || 'Medium'}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <h3 style={{ marginBottom: '10px' }}>About this Location</h3>
                        <p style={{ lineHeight: '1.6', color: '#444' }}>
                            {billboard.description || "Ideally located in a high-traffic zone, this billboard offers exceptional visibility for your campaign. Perfect for brand awareness and high-impact messaging."}
                        </p>
                    </div>
                </div>

                {/* Right Column: Booking & Pricing */}
                <div className="booking-sidebar">
                    <div className="pricing-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '20px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Booking & Pricing</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ color: '#666' }}>Base Daily Rate</span>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>NRs. {billboard.base_price}</div>
                        </div>

                        {/* Seasonal/Dynamic Info */}
                        <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#065f46', fontSize: '14px' }}>🔥 Seasonal Pricing Active</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>
                                Peak season multiplier (Oct-Dec) is <strong>1.5x</strong>. Book early to secure visibility!
                            </p>
                        </div>

                        <div style={{ padding: '20px', background: '#F9FAFB', borderRadius: '12px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Why Book This Spot?</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                                <li>High traffic visibility during peak hours</li>
                                <li>Perfect for brand awareness campaigns</li>
                                <li>Supports dynamic video & static ads</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => navigate(`/billboard/${id}/book`)}
                            className="login-btn full-width"
                            style={{
                                marginTop: 0,
                                fontSize: '16px',
                                padding: '15px',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Book This Billboard
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillboardDetails;
