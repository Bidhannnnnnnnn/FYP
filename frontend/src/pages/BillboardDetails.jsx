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

    const userRole = localStorage.getItem('role');

    useEffect(() => {
        const fetchBillboard = async () => {
            if (!id) return;
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280' }}>
            <div className="animate-pulse">Loading Billboard profile...</div>
        </div>
    );

    if (error) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#EF4444', marginBottom: '8px' }}>{error}</h3>
            <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
    );

    if (!billboard) return null;

    return (
        <div className="view-container" style={{ paddingBottom: '60px' }}>
            {/* Elegant Header/Back Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: '#fff',
                        border: '1.5px solid #E5E7EB',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        color: '#4B5563',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.color = '#667B68'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563'; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Explore Billboards
                </button>

                {userRole === 'business' && (
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
                        Reference ID: #{billboard.id}
                    </span>
                )}
            </div>

            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '48px' }}>

                {/* Left Column: Visuals & Narrative */}
                <div className="details-main">
                    <div className="hero-image-container" style={{
                        width: '100%',
                        height: '460px',
                        background: '#F3F4F6',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        marginBottom: '32px',
                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)',
                        position: 'relative',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        {billboard.image ? (
                            <img src={billboard.image} alt={billboard.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                <span>No Visual Asset Preview</span>
                            </div>
                        )}
                        <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#667B68', border: '1px solid rgba(102, 123, 104, 0.2)' }}>
                            {billboard.display_type?.toUpperCase() || 'PREMIUM'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '40px', color: '#111827', fontFamily: 'Outfit, sans-serif', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: '1.1' }}>
                            {billboard.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '16px', fontWeight: '500' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667B68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {billboard.location}
                        </div>
                    </div>

                    <div className="specs-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
                        {[
                            { label: 'Display Technology', value: billboard.display_type || 'Static High-Res', icon: '📺' },
                            { label: 'Asset Dimension', value: billboard.size || '30\' x 10\'', icon: '📏' },
                            { label: 'Traffic Density', value: billboard.traffic_density || 'High Velocity', icon: '🚗' },
                        ].map((spec, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: '20px', borderRadius: '18px', border: '1.5px solid #F3F4F6' }}>
                                <div style={{ fontSize: '20px', marginBottom: '12px' }}>{spec.icon}</div>
                                <span style={{ display: 'block', color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>{spec.label}</span>
                                <span style={{ fontWeight: '700', color: '#1F2937', fontSize: '15px' }}>{spec.value}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', paddingTop: '32px' }}>
                        <h3 style={{ fontSize: '20px', color: '#111827', fontWeight: '700', marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Description & Audience</h3>
                        <p style={{ lineHeight: '1.7', color: '#4B5563', fontSize: '16px', maxWidth: '90%' }}>
                            {billboard.description || "This premium placement captures high-intent traffic along one of the city's most traversed arterials. Ideally suited for brands looking to establish a dominant presence with vibrant, high-contrast creative."}
                        </p>
                    </div>
                </div>

                {/* Right Column: Pricing & Conversion */}
                <div className="booking-sidebar">
                    <div className="pricing-sticky-wrapper" style={{ position: 'sticky', top: '24px' }}>
                        <div className="pricing-card" style={{
                            background: '#fff',
                            padding: '32px',
                            borderRadius: '28px',
                            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ marginBottom: '32px' }}>
                                <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '600' }}>Investment Basis</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '36px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>NRs. {Number(billboard.base_price).toLocaleString()}</span>
                                    <span style={{ color: '#9CA3AF', fontSize: '16px', fontWeight: '500' }}>/ day</span>
                                </div>
                            </div>

                            <div style={{ padding: '20px', background: '#F8F9FA', borderRadius: '20px', marginBottom: '32px', border: '1px solid #F3F4F6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '700' }}>Placement Highlights</h4>
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '13px', color: '#6B7280' }}>
                                    {[
                                        'Verified high-visibility rating',
                                        'Surrounded by premium retail hubs',
                                        'Illuminated nocturnal exposure'
                                    ].map((point, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                                            <span style={{ color: '#667B68' }}>✓</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {userRole !== 'superadmin' && (
                                <button
                                    onClick={() => navigate(`/billboard/${id}/book`)}
                                    style={{
                                        width: '100%',
                                        padding: '18px',
                                        background: '#667B68',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 10px 25px -5px rgba(102, 123, 104, 0.4)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#586A5A'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#667B68'; }}
                                >
                                    Proceed to Booking
                                </button>
                            )}

                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>
                                Taxes and placement fees calculated at checkout.
                            </p>
                        </div>

                        {/* Secondary Context Card */}
                        <div style={{ marginTop: '24px', padding: '20px', background: '#F0FDF4', borderRadius: '20px', border: '1px solid #DCFCE7' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ fontSize: '20px' }}>⚡</span>
                                <div>
                                    <h5 style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '13px', fontWeight: '700' }}>High Demand Warning</h5>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#15803d', lineHeight: '1.5' }}>
                                        This slot is frequently booked for seasonal campaigns. Secure yours early.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Owner Information Card */}
                        <div style={{ marginTop: '24px', padding: '24px', background: '#fff', borderRadius: '20px', border: '1.5px solid #F3F4F6' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>Owner Information</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #667B68, #4A5D4C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>
                                    {(billboard.owner?.name || 'U')[0].toUpperCase()}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1F2937', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{billboard.owner?.company_name || billboard.owner?.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Verified Provider</p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {billboard.owner?.phone_number && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#4B5563' }}>
                                        <span style={{ fontSize: '14px' }}>📞</span>
                                        <span style={{ fontWeight: '600' }}>{billboard.owner.phone_number}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#4B5563' }}>
                                    <span style={{ fontSize: '14px' }}>✉️</span>
                                    <span style={{ fontWeight: '600' }}>{billboard.owner?.email}</span>
                                </div>
                                {billboard.owner?.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#4B5563' }}>
                                        <span style={{ fontSize: '14px' }}>📍</span>
                                        <span style={{ lineHeight: '1.4' }}>{billboard.owner.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillboardDetails;
