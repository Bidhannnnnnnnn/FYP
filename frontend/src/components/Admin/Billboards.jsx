import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertTriangle, Check, Edit, Image, Lock, Sparkles } from 'lucide-react';
import Pagination from '../Pagination';

const AdminBillboards = () => {
    const navigate = useNavigate();
    const [billboards, setBillboards] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirm, setConfirm]       = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchBillboards = async () => {
        setLoading(true);
        try {
            const res = await api.get('billboards/my/');
            setBillboards(res.data);
        } catch (err) {
            console.error('Error fetching billboards', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBillboards(); }, []);

    const filtered = useMemo(() => {
        let list = [...billboards];
        if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                b.title?.toLowerCase().includes(q) ||
                b.location?.toLowerCase().includes(q) ||
                b.owner?.name?.toLowerCase().includes(q) ||
                b.owner?.email?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [billboards, search, statusFilter]);

    // Pagination logic for filtered results
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedBillboards = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    const performAction = async () => {
        if (!confirm) return;
        setActionLoading(true);
        const { id, action, feedbackMessage } = confirm;
        const statusMap = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
        
        try {
            await api.patch(`billboards/approve/${id}/`, { 
                action,
                feedback_message: action === 'reject' ? feedbackMessage : ''
            });
            // Update local state instead of refetching for speed
            setBillboards(prev => prev.map(b => b.id === id ? { ...b, status: statusMap[action] } : b));
        } catch (err) {
            console.error('Action failed', err);
            fetchBillboards();
        } finally {
            setActionLoading(false);
            setConfirm(null);
        }
    };

    const counts = useMemo(() => {
        return billboards.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
        }, {});
    }, [billboards]);

    const STATUS_TABS = [
        { key: 'all',      label: 'All',           count: billboards.length },
        { key: 'pending',  label: 'Pending',       count: counts.pending  || 0 },
        { key: 'approved', label: 'Approved',      count: counts.approved || 0 },
        { key: 'rejected', label: 'Needs Changes', count: counts.rejected || 0 },
        { key: 'hidden',   label: 'Hidden',        count: counts.hidden   || 0 },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-dark)', letterSpacing: '-0.01em' }}>
                        Manage Billboards
                    </h1>
                    <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '16px' }}>
                        Review, approve, and manage billboard listings across the platform.
                    </p>
                </div>
                <button
                    onClick={fetchBillboards}
                    className="action-btn approve-btn"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', borderRadius: '10px' }}
                >
                    <svg className={loading ? 'ab-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh List
                </button>
            </div>

            {/* Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* Segmented Filter Control */}
                <div style={{ display: 'flex', background: 'var(--admin-card-bg)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    {STATUS_TABS.map(tab => {
                        const isActive = statusFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: isActive ? '600' : '500',
                                    background: isActive ? 'var(--admin-bg-color)' : 'transparent',
                                    color: isActive ? 'var(--admin-primary-green)' : 'var(--admin-text-muted)',
                                    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {tab.label}
                                <span style={{ 
                                    background: isActive ? 'var(--admin-primary-green)' : '#E5E7EB', 
                                    color: isActive ? '#fff' : 'var(--admin-text-muted)', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: '700' 
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
                    <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                        type="text"
                        placeholder="Search title, location, owner..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '12px 16px 12px 42px', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(0,0,0,0.08)', 
                            fontSize: '14px', 
                            boxSizing: 'border-box', 
                            outline: 'none',
                            background: 'var(--admin-card-bg)',
                            color: 'var(--admin-text-dark)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--admin-primary-green)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 123, 104, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        }}
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="admin-table-container" style={{ padding: 0 }}>
                {loading && billboards.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: 'var(--admin-primary-green)', borderRadius: '50%', animation: 'abSpin 0.8s linear infinite', margin: '0 auto 20px' }} />
                        <p style={{ margin: 0, fontWeight: '500', fontSize: '15px' }}>Loading billboards...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px', opacity: 0.4 }}><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                        <p style={{ margin: 0, fontSize: '16px', color: 'var(--admin-text-dark)' }}>No billboards found</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Try adjusting your search or filter settings.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '24px' }}>Billboard Details</th>
                                <th>Location</th>
                                <th>Owner Details</th>
                                <th>Base Pricing</th>
                                <th>Current Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBillboards.map(b => (
                                <tr key={b.id} onClick={() => navigate(`/admin/billboard-detail/${b.id}`)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '56px', height: '40px', borderRadius: '8px', background: 'var(--admin-bg-color)', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                {b.image
                                                    ? <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'var(--admin-text-muted)' }}><Image width={20} height={20} /></div>
                                                }
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '600', color: 'var(--admin-text-dark)', fontSize: '14px' }}>{b.title}</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>ID: #{b.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                            {b.location}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-dark)' }}>{b.owner?.name || 'Unknown User'}</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--admin-text-muted)' }}>{b.owner?.email}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--admin-primary-green)' }}>NRs. {b.base_price}</span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <span className={`status-badge status-${b.status}`} style={{ padding: '6px 12px', letterSpacing: '0.02em' }}>
                                            {b.status === 'pending' ? 'Pending Review' : b.status === 'approved' ? 'Approved & Live' : b.status === 'rejected' ? 'Needs Changes' : '○ Hidden'}
                                        </span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()} style={{ textAlign: 'right', paddingRight: '24px' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {b.status !== 'approved' && (
                                                <button className="action-btn approve-btn"
                                                    onClick={() => setConfirm({ id: b.id, action: 'approve', label: 'Approve', color: 'var(--admin-success)', feedbackMessage: '' })}
                                                    style={{ padding: '8px 16px', fontSize: '13px' }}>
                                                    Approve
                                                </button>
                                            )}
                                            {b.status !== 'rejected' && (
                                                <button className="action-btn"
                                                    style={{ background: '#FFFBEB', color: '#B45309', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FDE68A', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                                                    onClick={() => setConfirm({ id: b.id, action: 'reject', label: 'Request Changes', color: '#F59E0B', feedbackMessage: '' })}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; }}
                                                >
                                                    Request Changes
                                                </button>
                                            )}
                                            {(b.status === 'approved') && (
                                                <button className="action-btn"
                                                    style={{ background: 'var(--admin-bg-color)', color: 'var(--admin-text-muted)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                                                    onClick={() => setConfirm({ id: b.id, action: 'hide', label: 'Hide Listing', color: 'var(--admin-text-muted)', feedbackMessage: '' })}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = 'var(--admin-text-dark)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-bg-color)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; }}
                                                >
                                                    Hide
                                                </button>
                                            )}
                                            {(b.status === 'hidden') && (
                                                <button className="action-btn approve-btn"
                                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                                    onClick={() => setConfirm({ id: b.id, action: 'approve', label: 'Restore Full', color: 'var(--admin-primary-green)', feedbackMessage: '' })}>
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filtered.length}
                />
            )}

            {/* Interactive Confirmation Modal */}
            {confirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(31, 41, 55, 0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'var(--admin-card-bg)', borderRadius: '24px', padding: '40px', maxWidth: '460px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.4)' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: confirm.action === 'approve' ? '#ECFDF5' : confirm.action === 'reject' ? '#FFFBEB' : '#F3F4F6', color: confirm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: `1px solid ${confirm.action === 'approve' ? '#A7F3D0' : confirm.action === 'reject' ? '#FDE68A' : '#E5E7EB'}` }}>
                                {confirm.action === 'approve' ? <Sparkles width={20} height={20} /> : confirm.action === 'reject' ? <Edit width={20} height={20} /> : <Lock width={20} height={20} />}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '24px', color: 'var(--admin-text-dark)' }}>{confirm.label}?</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>Please confirm your action.</p>
                            </div>
                        </div>
                        
                        <div style={{ background: 'var(--admin-bg-color)', padding: '16px', borderRadius: '12px', marginBottom: '28px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: 0, color: 'var(--admin-text-dark)', fontSize: '14px', lineHeight: '1.6' }}>
                                {confirm.action === 'approve' && 'By approving this billboard, it will become immediately visible to all advertisers on the marketplace. They will be able to start submitting booking requests.'}
                                {confirm.action === 'reject'  && 'The owner will be notified to review and improve their listing details. You must provide specific, actionable feedback below so they know exactly what to fix.'}
                                {confirm.action === 'hide'    && "This listing will be immediately hidden from the public marketplace. The owner will not lose their data, and you can restore it at any time."}
                            </p>
                        </div>

                        {confirm.action === 'reject' && (
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--admin-text-dark)', marginBottom: '8px' }}>
                                    Improvement Feedback <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                </label>
                                <textarea
                                    value={confirm.feedbackMessage || ''}
                                    onChange={e => setConfirm({ ...confirm, feedbackMessage: e.target.value })}
                                    placeholder="e.g., Please upload a higher resolution image of the billboard..."
                                    style={{ 
                                        width: '100%', 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: '1px solid rgba(0,0,0,0.1)', 
                                        minHeight: '100px', 
                                        fontSize: '14px', 
                                        fontFamily: 'Inter, sans-serif', 
                                        resize: 'vertical', 
                                        outline: 'none', 
                                        boxSizing: 'border-box',
                                        background: 'var(--admin-bg-color)',
                                        color: 'var(--admin-text-dark)',
                                        transition: 'all 0.2s',
                                        lineHeight: '1.5'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--admin-warning)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                                        e.target.style.background = 'var(--admin-card-bg)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.background = 'var(--admin-bg-color)';
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setConfirm(null)} disabled={actionLoading}
                                style={{ flex: 1, padding: '14px', background: 'var(--admin-bg-color)', color: 'var(--admin-text-dark)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--admin-bg-color)'}
                            >
                                Cancel
                            </button>
                            <button onClick={performAction} disabled={actionLoading || (confirm.action === 'reject' && !confirm.feedbackMessage?.trim())}
                                style={{ 
                                    flex: 1, 
                                    padding: '14px', 
                                    background: confirm.action === 'approve' ? 'var(--admin-primary-green)' : confirm.color, 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: (actionLoading || (confirm.action === 'reject' && !confirm.feedbackMessage?.trim())) ? 'not-allowed' : 'pointer', 
                                    fontWeight: '600', 
                                    fontSize: '15px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '10px', 
                                    opacity: (actionLoading || (confirm.action === 'reject' && !confirm.feedbackMessage?.trim())) ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {actionLoading && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'abSpin 0.7s linear infinite' }} />}
                                {confirm.label} Billboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes abSpin { to { transform: rotate(360deg); } }
                .ab-spin { animation: abSpin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default AdminBillboards;
