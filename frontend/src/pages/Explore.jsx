import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvertiserDashboard.css';

const Explore = ({ billboards }) => {
    const navigate = useNavigate();

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recommended');

    // Apply search and sort
    const filteredBillboards = useMemo(() => {
        let result = billboards.filter(bb => {
            return bb.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bb.location?.toLowerCase().includes(searchQuery.toLowerCase());
        });

        if (sortBy === 'price_low') {
            result.sort((a, b) => parseFloat(a.base_price || 0) - parseFloat(b.base_price || 0));
        } else if (sortBy === 'price_high') {
            result.sort((a, b) => parseFloat(b.base_price || 0) - parseFloat(a.base_price || 0));
        } else if (sortBy === 'visibility') {
            result.sort((a, b) => parseFloat(b.visibility_score || 0) - parseFloat(a.visibility_score || 0));
        }

        return result;
    }, [billboards, searchQuery, sortBy]);

    return (
        <div style={{ position: 'relative' }}>
            <style>
                {`
                    .explore-ecommerce-header {
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        background: #F8F9FA;
                        padding: 14px 8px;
                        border-bottom: 1px solid #E5E7EB;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 28px;
                        gap: 20px;
                        flex-wrap: wrap;
                    }

                    .ecommerce-search-wrapper {
                        display: flex;
                        flex-grow: 1;
                        max-width: 580px;
                        height: 46px;
                        border-radius: 8px;
                        border: 1.5px solid #D1D5DB;
                        overflow: hidden;
                        background: #ffffff;
                        transition: border-color 0.18s, box-shadow 0.18s;
                    }

                    .ecommerce-search-wrapper:focus-within {
                        border-color: #667B68;
                        box-shadow: 0 0 0 3px rgba(102, 123, 104, 0.12);
                    }

                    .ecommerce-search-input {
                        flex-grow: 1;
                        border: none;
                        background: transparent;
                        padding: 0 14px;
                        font-size: 14px;
                        color: #111827;
                        letter-spacing: 0.01em;
                        outline: none;
                    }

                    .ecommerce-search-input::placeholder {
                        color: #9CA3AF;
                        font-weight: 400;
                    }

                    .ecommerce-search-btn {
                        background: #667B68;
                        color: #ffffff;
                        border: none;
                        width: 52px;
                        flex-shrink: 0;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background 0.15s;
                    }

                    .ecommerce-search-btn:hover {
                        background: #4A5D4C;
                    }

                    .ecommerce-sort-container {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 13px;
                        color: #6B7280;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }

                    .ecommerce-sort-select {
                        border: none;
                        background: transparent;
                        font-size: 14px;
                        font-weight: 600;
                        color: #667B68;
                        cursor: pointer;
                        outline: none;
                        border-bottom: 1.5px solid #A3B899;
                        padding-bottom: 1px;
                    }
                `}
            </style>

            {/* Sticky Ecommerce Header */}
            <div className="explore-ecommerce-header">
                <div>
                    <h2 style={{ margin: '0', fontSize: '24px', color: '#111827', fontFamily: 'Outfit, sans-serif', fontWeight: '800' }}>
                        Billboards
                    </h2>
                </div>

                <div className="ecommerce-search-wrapper">
                    <input
                        type="text"
                        className="ecommerce-search-input"
                        placeholder="Search locations, titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="ecommerce-search-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>

                <div className="ecommerce-sort-container">
                    <span>Sort by:</span>
                    <select
                        className="ecommerce-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recommended">Best Match</option>
                        <option value="price_low">Price: Low - High</option>
                        <option value="price_high">Price: High - Low</option>
                        <option value="visibility">Highest Visibility</option>
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            {filteredBillboards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🪧</div>
                    <h3 style={{ fontSize: '20px', color: '#374151', margin: '0 0 8px 0' }}>No billboards found</h3>
                    <p style={{ color: '#6B7280', margin: 0, fontSize: '15px' }}>Try adjusting your search or filters to see more results.</p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '16px', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                        Showing {filteredBillboards.length} result{filteredBillboards.length !== 1 ? 's' : ''}
                    </div>
                    <div className="billboards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                        {filteredBillboards.map(bb => (
                            <div key={bb.id} className="billboard-premium-card" style={{
                                background: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }} onClick={() => navigate(`/billboard/${bb.id}`)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.01)';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)';
                                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                                }}
                            >
                                {/* Image Container */}
                                <div style={{ height: '220px', position: 'relative', overflow: 'hidden', background: '#F3F4F6' }}>
                                    {bb.image ? (
                                        <img src={bb.image} alt={bb.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="bb-card-img" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                                            <span style={{ fontSize: '32px' }}>📷</span>
                                        </div>
                                    )}

                                    {/* Display Type Badge */}
                                    {bb.display_type && (
                                        <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                                            <span style={{
                                                padding: '6px 14px',
                                                background: 'rgba(255,255,255,0.95)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '30px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: '#374151',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)',
                                                letterSpacing: '0.02em'
                                            }}>
                                                {bb.display_type}
                                            </span>
                                        </div>
                                    )}

                                    {/* Price Overlay */}
                                    <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                                        <div style={{
                                            background: '#1F2937',
                                            color: '#fff',
                                            padding: '8px 14px',
                                            borderRadius: '12px',
                                            fontWeight: '700',
                                            fontSize: '16px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            NRs {bb.base_price}<span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500', marginLeft: '4px' }}>/day</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: '700', lineHeight: '1.3', fontFamily: 'Outfit, sans-serif' }}>
                                            {bb.title}
                                        </h4>
                                    </div>

                                    <p style={{ margin: '0 0 20px 0', color: '#6B7280', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                        <span style={{ color: '#9CA3AF' }}>📍</span>
                                        {bb.location}
                                    </p>

                                    {/* Meta Tags Row */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', marginBottom: '24px' }}>
                                        <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                            📐 {bb.size || 'Standard'}
                                        </span>
                                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                            🚗 {bb.traffic_density} Traffic
                                        </span>
                                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                            👁️ {bb.visibility_score}/10 Visibility
                                        </span>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        style={{
                                            width: '100%',
                                            padding: '12px 20px',
                                            fontSize: '15px',
                                            background: '#667B68',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s, transform 0.1s'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/billboard/${bb.id}`);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#4A5D4C'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#667B68'}
                                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Explore;
