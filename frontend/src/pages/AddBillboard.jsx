import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, NavLink, useLocation } from 'react-router-dom';
import api from '../services/api';
import { validatePrice } from '../utils/validation';
import './AdvertiserDashboard.css';
import logoImg from '../assets/BimbasetuLogo.png';
import { Book, Building, Camera, Check, CheckCircle, ClipboardList, IndianRupee, File, Image, Map, MapPin, Scale, Sparkles, XCircle, Zap } from 'lucide-react';

const STEP_CONFIG = [
    { id: 1, label: 'General Info', icon: <ClipboardList width={20} height={20} /> },
    { id: 2, label: 'Specs & Pricing', icon: <IndianRupee width={20} height={20} /> },
    { id: 3, label: 'Visuals & Location', icon: <Map width={20} height={20} /> },
    { id: 4, label: 'Legal Clearance', icon: <Scale width={20} height={20} /> },
];

const densityMap = { Low: 1, Medium: 5, High: 10 };
const densityReverseMap = { 1: 'Low', 5: 'Medium', 10: 'High' };

const InputField = ({ label, hint, required, children }) => (
    <div style={{ marginBottom: '22px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
            {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        {children}
        {hint && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>{hint}</p>}
    </div>
);

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500',
    color: '#111827',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const AddBillboard = () => {
    const navigate = useNavigate();
    const { editId } = useParams();
    const location = useLocation();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '', location: '', description: '',
        base_price: '', size: '',
        display_type: 'Digital', traffic_density: 'Medium',
        visibility_score: 5, weekend_multiplier: 0.80, location_tier: 'standard',
        booking_lead_days: 2,
        latitude: '', longitude: '',
        image: null,
    });
    const [legalFiles, setLegalFiles] = useState([]); // Multiple legal docs

    useEffect(() => {
        if (!editId) return;
        const fetchBillboard = async () => {
            try {
                const res = await api.get(`billboards/detail/${editId}/`);
                const b = res.data;
                const densityStr = densityReverseMap[b.traffic_density] || 'Medium';
                setFormData({
                    title: b.title || '',
                    location: b.location || '',
                    description: b.description || '',
                    base_price: b.base_price || '',
                    size: b.size || '',
                    display_type: b.display_type || 'Digital',
                    traffic_density: densityStr,
                    visibility_score: b.visibility_score || 5,
                    weekend_multiplier: b.weekend_multiplier || 0.80,
                    location_tier: b.location_tier || 'standard',
                    booking_lead_days: b.booking_lead_days ?? 2,
                    latitude: b.latitude || '',
                    longitude: b.longitude || '',
                    image: null,
                });
                if (b.image) setImagePreview(b.image);
            } catch (e) {
                console.error('Failed to load billboard for editing', e);
            }
        };
        fetchBillboard();
    }, [editId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            handleImageFile(file);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageFile = (file) => {
        if (!file) {
            setImagePreview(null);
            setFormData(prev => ({ ...prev, image: null }));
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast(`Image too large! Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`, 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please upload a valid image file (PNG, JPG, WEBP)', 'error');
            return;
        }

        setFormData(prev => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleImageFile(files[0]);
        }
    };

    const handleLegalFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setLegalFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeLegalFile = (index) => {
        setLegalFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'image') {
                if (formData.image) data.append('image', formData.image);
            } else if (key === 'traffic_density') {
                data.append('traffic_density', densityMap[formData.traffic_density] || 5);
            } else {
                data.append(key, formData[key]);
            }
        });

        // Append multiple legal documents
        legalFiles.forEach(file => {
            data.append('uploaded_documents', file);
        });

        try {
            if (editId) {
                await api.patch(`billboards/update/${editId}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Billboard updated successfully!', 'success');
            } else {
                await api.post('billboards/add/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Billboard listed successfully!', 'success');
            }
            setTimeout(() => navigate('/owner/billboards'), 1500);
        } catch (error) {
            console.error('Billboard Save Error:', error);
            showToast('Failed to save: ' + (error.response?.data?.detail || 'Check all fields and retry.'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const isStepValid = () => {
        if (step === 1) return formData.title.trim() && formData.location.trim();
        if (step === 2) return formData.base_price && validatePrice(formData.base_price) && formData.size && formData.display_type;
        if (step === 3) {
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);
            // Require valid coordinate ranges. If editing, image might be a URL instead of file object, but it exists.
            const hasImage = formData.image || imagePreview;
            return hasImage && !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180;
        }
        return true;
    };

    return (
        <div className="dashboard-container">
            {/* ── Sidebar ── */}
            <div className="sidebar">
                <div className="brand-section">
                    <img src={logoImg} alt="Bimbasetu Logo" className="sidebar-logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div className="nav-section-label">Menu</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <NavLink to="/owner" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></span>
                                <span className="nav-text">Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/owner/requests" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></span>
                                <span className="nav-text">Requests</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/owner/billboards" className={({ isActive }) => (isActive || location.pathname.startsWith('/owner/billboard')) ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg></span>
                                <span className="nav-text">My Billboards</span>
                            </NavLink>
                        </li>
                    </ul>

                    <div className="nav-section-label" style={{ marginTop: '24px' }}>Finance</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <NavLink to="/owner/billing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></span>
                                <span className="nav-text">Billing &amp; Payments</span>
                            </NavLink>
                        </li>
                    </ul>

                    <div className="nav-section-label" style={{ marginTop: '24px' }}>Account</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <NavLink to="/owner/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg></span>
                                <span className="nav-text">Settings</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></span>
                                <span className="nav-text">About Us</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', gap: '10px', transition: 'background 0.2s', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <NavLink to="/owner/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}>
                            <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #667B68, #4A5D4C)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>O</div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Owner</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Billboard Owner</div>
                            </div>
                        </NavLink>
                        <button
                            onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('role'); navigate('/login'); }}
                            title="Sign Out"
                            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="main-content" style={{ background: 'linear-gradient(135deg, #F0F4F1 0%, #F8FBF8 100%)', overflowY: 'auto' }}>

                {/* Toast */}
                {toast.show && (
                    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type === 'success' ? '#10B981' : '#EF4444', color: '#fff', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', fontSize: '15px', animation: 'slideIn 0.3s ease' }}>
                        <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? <CheckCircle width={20} height={20} /> : '<XCircle width={20} height={20} />'}</span>
                        {toast.message}
                    </div>
                )}

                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button type="button" onClick={() => navigate('/owner/billboards')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', color: '#374151', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#667B68'; e.currentTarget.style.color = '#667B68'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                            Back
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>
                                {editId ? <Sparkles width={20} height={20} /> : <Building width={20} height={20} />} List a Billboard
                            </h1>
                            <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
                                {editId ? 'Update your existing listing.' : 'Add your billboard to the Bimbasetu marketplace.'}
                            </p>
                        </div>
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {STEP_CONFIG.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div
                                    onClick={() => s.id < step ? setStep(s.id) : null}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: step === s.id ? '#667B68' : step > s.id ? '#D1FADF' : '#F3F4F6', color: step === s.id ? '#fff' : step > s.id ? '#166534' : '#9CA3AF', fontSize: '12px', fontWeight: '700', cursor: s.id < step ? 'pointer' : 'default', transition: 'all 0.3s' }}
                                >
                                    <span>{step > s.id ? <Check width={16} height={16} /> : s.icon}</span>
                                    <span>{s.label}</span>
                                </div>
                                {i < STEP_CONFIG.length - 1 && (
                                    <div style={{ width: '20px', height: '2px', background: step > s.id ? '#667B68' : '#E5E7EB', borderRadius: '2px', transition: 'background 0.3s' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form — onSubmit is a hard guard; actual submit is via button onClick */}
                <form onSubmit={e => e.preventDefault()}>
                    {/* Step 1 — General Info */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ background: '#fff', borderRadius: '28px', padding: '40px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #667B68, #4A5E4C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><ClipboardList width={20} height={20} /></div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>General Information</h2>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>Tell advertisers where your billboard is and what makes it stand out.</p>
                                    </div>
                                </div>
                                <InputField label="Billboard Title" required>
                                    <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Kathmandu Mall Digital LED Screen" required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.boxShadow = '0 0 0 3px rgba(102,123,104,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                                <InputField label="Location" required hint="Use a recognizable address — e.g. district, street, or landmark.">
                                    <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Putalisadak, Kathmandu" required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.boxShadow = '0 0 0 3px rgba(102,123,104,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                                <InputField label="Description" hint="Optional — describe the visibility, target audience, or any key highlights.">
                                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="High-footfall area, visible from major crossroads, 24/7 illuminated..." rows={4}
                                        style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                                        onFocus={e => { e.target.style.borderColor = '#667B68'; e.target.style.boxShadow = '0 0 0 3px rgba(102,123,104,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Specs & Pricing */}
                    {step === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ background: '#fff', borderRadius: '28px', padding: '36px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><IndianRupee width={20} height={20} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Pricing</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>Set your base daily rate.</p>
                                    </div>
                                </div>
                                <InputField label="Daily Base Rate (NRs.)" required hint={`"How much do I want to earn if my billboard runs a standard 10-second ad, 10 times per hour, for a full 24 hours, on a normal weekday?" That number is your base rate. Peak hours, weekdays/weekends, and advertiser settings multiply on top of it.`}>
                                    <input name="base_price" type="number" min="0" value={formData.base_price} onChange={handleChange} placeholder="e.g. 5000" required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                                <InputField label="Weekend Pricing Multiplier" required hint="Weekends have less traffic. Default is 0.80x (-20%).">
                                    <input name="weekend_multiplier" type="number" step="0.01" min="0.10" max="5.00" value={formData.weekend_multiplier} onChange={handleChange} required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                                <InputField label="Dimensions" required>
                                    <input name="size" value={formData.size} onChange={handleChange} placeholder="e.g. 20ft × 10ft" required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                            </div>

                            <div style={{ background: '#fff', borderRadius: '28px', padding: '36px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Zap width={20} height={20} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Specifications</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>Display type and audience reach.</p>
                                    </div>
                                </div>
                                <InputField label="Display Type" required>
                                    <select name="display_type" value={formData.display_type} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="Digital">Digital (LED / LCD)</option>
                                        <option value="Static">Static (Vinyl / Print)</option>
                                    </select>
                                </InputField>
                                <InputField label="Traffic Density">
                                    <select name="traffic_density" value={formData.traffic_density} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="Low">Low — Quiet residential area</option>
                                        <option value="Medium">Medium — Main road / commercial</option>
                                        <option value="High">High — Major junction / plaza</option>
                                    </select>
                                </InputField>
                                <InputField label={`Visibility Score: ${formData.visibility_score}/10`} hint="Rate how visible the billboard is from the main road.">
                                    <input type="range" name="visibility_score" min="1" max="10" step="1" value={formData.visibility_score} onChange={handleChange}
                                        style={{ width: '100%', accentColor: '#667B68', height: '6px', cursor: 'pointer' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                        <span>Low</span><span>Excellent</span>
                                    </div>
                                </InputField>
                                <InputField label="Booking Lead Days" required hint="Minimum days in advance advertisers must book. Default is 2.">
                                    <input name="booking_lead_days" type="number" min="1" max="30" value={formData.booking_lead_days} onChange={handleChange} required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                </InputField>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Visuals & Location */}
                    {step === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
                            <div style={{ background: '#fff', borderRadius: '28px', padding: '36px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Image width={20} height={20} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Billboard Image</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>Upload a clear photo for your listing.</p>
                                    </div>
                                </div>
                                {/* Hidden real file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                {/* Clickable upload area — div avoids label's implicit form-submit behaviour */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    style={{ display: 'block', border: imagePreview ? 'none' : '2.5px dashed #D1D5DB', borderRadius: '20px', padding: imagePreview ? 0 : '48px 24px', background: imagePreview ? '#000' : '#F9FAFB', cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '280px', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { if (!imagePreview) e.currentTarget.style.borderColor = '#667B68'; }}
                                    onMouseLeave={e => { if (!imagePreview) e.currentTarget.style.borderColor = '#D1D5DB'; }}
                                >
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '280px', display: 'block' }} />
                                            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
                                                <Camera width={20} height={20} /> Click to change image
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ pointerEvents: 'none' }}>
                                            <div style={{ width: '64px', height: '64px', background: '#F3F4F6', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}><Image width={20} height={20} /></div>
                                            <p style={{ margin: 0, fontWeight: '700', color: '#374151', fontSize: '15px' }}>Drop your image here</p>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#9CA3AF' }}>or click to browse</p>
                                            <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#D1D5DB', fontWeight: '600' }}>PNG, JPG, WEBP — up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: '#fff', borderRadius: '28px', padding: '36px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><MapPin width={20} height={20} /></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Location Details & Coordinates</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>Setting premium tiers boosts dynamic pricing bounds.</p>
                                    </div>
                                </div>
                                <InputField label="Location Value Tier" required>
                                    <select name="location_tier" value={formData.location_tier} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}
                                        onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}>
                                        <option value="standard">Standard Area (1.0x price)</option>
                                        <option value="prime">Prime District (1.5x price)</option>
                                        <option value="ultra">Ultra-Prime City Center (2.0x price)</option>
                                    </select>
                                </InputField>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <InputField label="Latitude" hint="e.g. 27.7172" required>
                                        <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="27.7172" style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                    </InputField>
                                    <InputField label="Longitude" hint="e.g. 85.3240" required>
                                        <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="85.3240" style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                                    </InputField>
                                </div>

                                {/* Live summary */}
                                <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, #F0F4F1, #E8F0E8)', borderRadius: '16px', padding: '20px', border: '1px solid #D1E7D2' }}>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}><ClipboardList width={20} height={20} /> Summary</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {[
                                            { l: 'Title', v: formData.title || '—' },
                                            { l: 'Location', v: formData.location || '—' },
                                            { l: 'Rate', v: formData.base_price ? `NRs. ${formData.base_price}/day` : '—' },
                                            { l: 'Size', v: formData.size || '—' },
                                            { l: 'Type', v: formData.display_type },
                                            { l: 'Traffic', v: formData.traffic_density },
                                        ].map(item => (
                                            <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                <span style={{ color: '#6B7280', fontWeight: '600' }}>{item.l}</span>
                                                <span style={{ color: '#111827', fontWeight: '700', maxWidth: '130px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4 — Legal Documents */}
                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
                            <div style={{ background: '#fff', borderRadius: '28px', padding: '40px', border: '1.5px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Scale width={20} height={20} />️</div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>Legal Clearance</h2>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>Upload land permits, city council approval, or any legal clearance documents.</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', border: '2px dashed #D1D5DB', borderRadius: '20px', background: '#F9FAFB', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = '#667B68'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                                        <input type="file" multiple onChange={handleLegalFileChange} style={{ display: 'none' }} />
                                        <div style={{ width: '56px', height: '56px', background: '#F3F4F6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}><File width={20} height={20} /></div>
                                        <span style={{ fontWeight: '700', color: '#374151', fontSize: '15px' }}>Click to upload multiple documents</span>
                                        <span style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '6px' }}>PDF, PNG, or JPG accepted</span>
                                    </label>
                                </div>

                                {legalFiles.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '700', color: '#111827' }}>Attached Documents ({legalFiles.length})</p>
                                        {legalFiles.map((file, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#F9FAFB', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                                                <div style={{ fontSize: '20px' }}>{file.type.includes('pdf') ? <Book width={20} height={20} /> : <Image width={20} height={20} />}</div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <button type="button" onClick={() => removeLegalFile(idx)} 
                                                    style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: '24px', padding: '16px', background: '#FFFBEB', borderRadius: '16px', border: '1px solid #FDE68A', display: 'flex', gap: '12px' }}>
                                    <div style={{ fontSize: '18px', marginTop: '2px' }}>ℹ️</div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
                                        <strong>Note:</strong> While optional, providing complete legal documentation accelerates the admin approval process. Your documents are stored securely and visible only to administrators.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', padding: '24px', background: '#fff', borderRadius: '20px', border: '1.5px solid #F3F4F6', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/owner/billboards')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#374151', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                            {step > 1 ? 'Previous' : 'Cancel'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {STEP_CONFIG.map(s => (
                                <div key={s.id} style={{ width: step === s.id ? '24px' : '8px', height: '8px', borderRadius: '4px', background: step >= s.id ? '#667B68' : '#E5E7EB', transition: 'all 0.3s' }} />
                            ))}
                        </div>

                        {step < 4 ? (
                            <button type="button" onClick={() => { if (isStepValid()) setStep(s => s + 1); }} disabled={!isStepValid()}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '14px', border: 'none', background: isStepValid() ? '#667B68' : '#D1D5DB', color: '#fff', cursor: isStepValid() ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', boxShadow: isStepValid() ? '0 4px 12px rgba(102,123,104,0.3)' : 'none' }}
                                onMouseEnter={e => { if (isStepValid()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                                Continue
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '14px', border: 'none', background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #667B68, #4A5E4C)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '15px', transition: 'all 0.2s', boxShadow: submitting ? 'none' : '0 6px 20px rgba(102,123,104,0.4)' }}
                                onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                                {submitting ? (
                                    <>
                                        <div style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        {editId ? 'Update Billboard' : 'Publish Billboard'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
};

export default AddBillboard;
