import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './AdvertiserDashboard.css';
import logoImg from '../assets/BimbasetuLogo.png';

const About = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const isAdmin = role === 'superadmin';
    const isOwner = role === 'business';
    const adminName = localStorage.getItem('name') || 'User';
    const base = isAdmin ? '/admin' : isOwner ? '/owner' : '/advertiser';

    const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'U';

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="brand-section">
                    <img src={logoImg} alt="Bimbasetu" className="sidebar-logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div className="nav-section-label">Menu</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {isAdmin ? (<>
                            <li><NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span><span className="nav-text">Dashboard</span></NavLink></li>
                            <li><NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span className="nav-text">Bookings</span></NavLink></li>
                            <li><NavLink to="/admin/billboards" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg></span><span className="nav-text">Billboards</span></NavLink></li>
                            <li><NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span className="nav-text">Users</span></NavLink></li>
                        </>) : isOwner ? (<>
                            <li><NavLink to="/owner" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span><span className="nav-text">Dashboard</span></NavLink></li>
                            <li><NavLink to="/owner/requests" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span className="nav-text">Requests</span></NavLink></li>
                            <li><NavLink to="/owner/billboards" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg></span><span className="nav-text">My Billboards</span></NavLink></li>
                        </>) : (<>
                            <li><NavLink to="/advertiser" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span><span className="nav-text">Dashboard</span></NavLink></li>
                            <li><NavLink to="/advertiser/explore" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></span><span className="nav-text">Explore Billboards</span></NavLink></li>
                            <li><NavLink to="/advertiser/my-bookings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></span><span className="nav-text">My Bookings</span></NavLink></li>
                        </>)}
                    </ul>
                    <div className="nav-section-label" style={{ marginTop: '24px' }}>Finance</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li><NavLink to={`${base}/billing`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span><span className="nav-text">Billing & Payments</span></NavLink></li>
                    </ul>
                    <div className="nav-section-label" style={{ marginTop: '24px' }}>Account</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li><NavLink to={`${base}/profile`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span><span className="nav-text">Settings</span></NavLink></li>
                        <li><NavLink to="/about" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span><span className="nav-text">About Us</span></NavLink></li>
                    </ul>
                </nav>
                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', gap: '10px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <NavLink to={`${base}/profile`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexGrow: 1, overflow: 'hidden' }}>
                            <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #667B68, #4A5D4C)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{getInitials(adminName)}</div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{isAdmin ? 'Super Admin' : isOwner ? 'Billboard Owner' : 'Advertiser'}</div>
                            </div>
                        </NavLink>
                        <button onClick={() => { localStorage.clear(); navigate('/login'); }} title="Sign Out"
                            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="main-content" style={{ overflowY: 'auto' }}>

                {/* Hero */}
                <div style={{ marginBottom: '56px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0F4EF', border: '1px solid #D1E0D3', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#667B68', display: 'inline-block' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#667B68', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nepal's Billboard Marketplace</span>
                    </div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '40px', fontWeight: '900', color: '#111827', margin: '0 0 16px', lineHeight: '1.1' }}>
                        Outdoor advertising,<br />finally made simple.
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px', lineHeight: '1.8', margin: 0 }}>
                        Bimbasetu bridges the gap between billboard owners and the brands that want to reach people. One platform. Every screen. Zero friction.
                    </p>
                </div>

                {/* Mission */}
                <div style={{ background: 'linear-gradient(135deg, #667B68 0%, #4A5D4C 100%)', borderRadius: '24px', padding: '40px 48px', marginBottom: '56px', color: '#fff' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', margin: '0 0 12px' }}>Our Mission</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: '700', lineHeight: '1.55', margin: 0, maxWidth: '680px' }}>
                        To make outdoor advertising as accessible, transparent, and measurable as digital — for everyone from a local business to a national brand.
                    </p>
                </div>

                {/* Who it's for */}
                <div style={{ marginBottom: '56px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', margin: '0 0 6px' }}>Who It's For</p>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 32px' }}>Built for three kinds of people</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                        {[
                            { emoji: '📢', title: 'Advertisers', color: '#3B82F6', bg: '#EFF6FF', desc: 'Brands, agencies, and individuals who want their message in front of real people, in real places. A searchable inventory of verified billboards, transparent pricing, and a booking flow that takes minutes — not weeks.' },
                            { emoji: '🏙️', title: 'Billboard Owners', color: '#667B68', bg: '#F0F4EF', desc: 'Property owners and media companies who want to monetise their screens without the overhead of a sales team. List your inventory, set your rates, and let the platform handle scheduling, payments, and ad playback.' },
                            { emoji: '🛡️', title: 'Super Admins', color: '#8B5CF6', bg: '#F5F3FF', desc: 'The team that keeps the marketplace honest. Admins verify listings, moderate accounts, resolve disputes, and have full visibility into every transaction and campaign — all from a single control panel.' },
                        ].map(c => (
                            <div key={c.title} style={{ background: c.bg, borderRadius: '20px', padding: '28px', border: `1px solid ${c.color}20` }}>
                                <div style={{ fontSize: '30px', marginBottom: '14px' }}>{c.emoji}</div>
                                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>{c.title}</h3>
                                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.8', margin: 0 }}>{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '56px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', margin: '0 0 6px' }}>Platform Features</p>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 32px' }}>Everything in one place</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                            { icon: '🗺️', title: 'Verified Inventory', desc: 'Every billboard is reviewed and approved before it goes live. Advertisers always see accurate listings with real photos, GPS coordinates, and honest specs.' },
                            { icon: '📅', title: 'Real-Time Availability', desc: 'The booking calendar reflects live data. Dates already claimed by other campaigns are blocked automatically — no double-bookings.' },
                            { icon: '💸', title: 'Transparent Pricing', desc: 'Every campaign price is calculated from the billboard\'s daily base rate — what the owner earns if their billboard runs a standard 10-second ad, 10 times per hour, for a full 24 hours on a normal weekday. Peak hours (8–10am, 4–6pm), festive months (Oct–Dec), location tier, traffic density, visibility score, and the advertiser\'s chosen slot duration and frequency all multiply on top. The final number is shown before payment — no surprises.' },
                            { icon: '📺', title: 'Digital Ad Playback', desc: 'A built-in player schedules and displays approved campaigns automatically — down to the exact second, based on each campaign\'s frequency settings.' },
                            { icon: '🔔', title: 'Live Notifications', desc: 'Every meaningful event — a booking approval, a revision request, a payment confirmation — triggers an in-app notification.' },
                            { icon: '📊', title: 'Analytics & Reporting', desc: 'Owners get occupancy charts and revenue breakdowns. Admins get platform-wide trends, user distribution, and booking analytics — all filterable.' },
                            { icon: '📄', title: 'Invoicing', desc: 'Every completed payment generates a downloadable PDF invoice. Full billing history is accessible at any time.' },
                            { icon: '⚖️', title: 'Fair Moderation', desc: 'Accounts that violate platform rules can be suspended with a clear reason. Suspended users have the right to appeal, and every appeal gets a written response.' },
                        ].map(f => (
                            <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #F3F4F6', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '26px', flexShrink: 0 }}>{f.icon}</span>
                                <div>
                                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{f.title}</h4>
                                    <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.75', margin: 0 }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Values */}
                <div style={{ marginBottom: '56px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', margin: '0 0 6px' }}>Our Values</p>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 32px' }}>What we stand for</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                        {[
                            { title: 'Transparency', desc: 'Pricing, availability, and platform decisions are always visible and explainable. No hidden fees, no opaque processes.' },
                            { title: 'Fairness', desc: 'Every user operates under the same clear rules. Disputes are handled with a written record on both sides.' },
                            { title: 'Reliability', desc: 'From the booking calendar to the ad player, the platform is built to be dependable. When a campaign is live, it plays.' },
                        ].map(v => (
                            <div key={v.title} style={{ background: '#F8F9FA', borderRadius: '16px', padding: '26px', border: '1px solid #E5E7EB' }}>
                                <div style={{ width: '32px', height: '3px', background: '#667B68', borderRadius: '2px', marginBottom: '14px' }} />
                                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>{v.title}</h4>
                                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.75', margin: 0 }}>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform rules */}
                <div style={{ marginBottom: '56px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', margin: '0 0 6px' }}>Platform Rules</p>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 12px' }}>A marketplace built on trust</h2>
                    <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.8', maxWidth: '640px', margin: '0 0 28px' }}>
                        Listings must be accurate, creatives must be original, and interactions must be in good faith. Accounts that act against these principles are subject to suspension — with a clear reason always provided.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {[
                            { label: 'Suspensions', desc: 'Issued by admins when a user violates platform rules. The reason is always communicated clearly to the user.' },
                            { label: 'Appeals', desc: 'Every suspended user has the right to appeal. Appeals are reviewed individually and responded to in writing.' },
                            { label: 'Reinstatement', desc: 'Approved appeals restore full account access immediately. Admins can also reinstate accounts directly at any time.' },
                            { label: 'Permanent Removal', desc: 'Reserved for severe or repeated violations. This is a last resort, not a first response.' },
                        ].map(r => (
                            <div key={r.label} style={{ background: '#fff', borderRadius: '12px', padding: '18px 22px', border: '1px solid #E5E7EB', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#667B68', flexShrink: 0, marginTop: '5px' }} />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 3px' }}>{r.label}</p>
                                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: '1.6' }}>{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#F8F9FA', borderRadius: '20px', padding: '28px 36px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: '800', color: '#111827', margin: '0 0 3px' }}>Bimbasetu Digital Signage Network</p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Operating across Nepal · All prices in NRs. · Last updated March 2026</p>
                    </div>
                    <button onClick={() => navigate(base)} style={{ padding: '10px 22px', borderRadius: '10px', background: '#667B68', color: '#fff', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                        Go to Dashboard
                    </button>
                </div>

            </div>
        </div>
    );
};

export default About;
