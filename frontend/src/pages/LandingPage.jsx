import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// Import local billboard images
import heroImg from '../assets/landing/Durbarmarg.jpg';
import koteshworImg from '../assets/landing/Koteshwor Billboard.png';
import tripureshowrImg from '../assets/landing/Tripureshowr.jpg';
import logoImg from '../assets/BimbasetuLogo.png';

const LandingPage = () => {
    return (
        <div className="landing-wrap">
            {/* Navbar */}
            <nav className="landing-nav">
                <Link to="/" className="nav-brand">
                    <img src={logoImg} alt="Bimbasetu Logo" className="nav-logo-img" />
                </Link>
                <div className="nav-links">
                    <a href="#features" className="nav-link">Solutions</a>
                    <a href="#gallery" className="nav-link">Live Boards</a>
                    <a href="#how-it-works" className="nav-link">Process</a>
                </div>
                <div className="nav-btns">
                    <Link to="/login" className="btn-signin">Sign In</Link>
                    <Link to="/signup" className="btn-getstarted">Start Growing</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <img src={heroImg} alt="Durbarmarg Billboard" />
                    <div className="hero-image-overlay"></div>
                </div>
                
                <div className="hero-content">
                    <h1>Elevate Your Brand with High-Impact Billboards.</h1>
                    <p>
                        Bimbasetu is the premium marketplace connecting world-class advertisers 
                        with elite billboard owners across the nation. Manage, track, and scale 
                        your out-of-home advertising with surgical precision.
                    </p>
                    <div className="hero-cta-box">
                        <Link to="/signup" className="btn-hero-primary">Get Started Now</Link>
                        <a href="#features" className="btn-hero-secondary">
                            Explore Solutions
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="stats-section">
                <div className="stat-item">
                    <h2>500+</h2>
                    <p>Premium Locations</p>
                </div>
                <div className="stat-item">
                    <h2>1.2M</h2>
                    <p>Daily Impressions</p>
                </div>
                <div className="stat-item">
                    <h2>98%</h2>
                    <p>Owner Satisfaction</p>
                </div>
                <div className="stat-item">
                    <h2>24/7</h2>
                    <p>Live Monitoring</p>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="features" style={{ paddingBottom: '0' }}>
                <div className="section-header">
                    <span className="section-tag">Live Inventory</span>
                    <h2>Premium Placements Across the City</h2>
                    <p style={{ color: 'var(--slate-500)' }}>Real-world impact from our most sought-after locations in Kathmandu.</p>
                </div>
                <div className="gallery-section">
                    <div className="gallery-item">
                        <img src={koteshworImg} alt="Koteshwor Billboard" />
                        <div className="gallery-label">Koteshwor Gateway</div>
                    </div>
                    <div className="gallery-item">
                        <img src={tripureshowrImg} alt="Tripureshowr Billboard" />
                        <div className="gallery-label">Tripureshuwor Junction</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <span className="section-tag">Powerful Ecosystem</span>
                    <h2>Tailored Solutions for Every Stakeholder</h2>
                    <p style={{ fontSize: '18px', color: 'var(--slate-500)', maxWidth: '600px' }}>
                        Whether you own a single board or manage a national network, 
                        Bimbasetu provides the enterprise tools you need to succeed.
                    </p>
                </div>

                <div className="features-grid">
                    {/* For Owners */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        </div>
                        <h3>For Billboard Owners</h3>
                        <ul>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Real-time Revenue Tracking
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Smart Occupancy Management
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Digital Document Verification
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Automated Invoicing & Billing
                            </li>
                        </ul>
                    </div>

                    {/* For Advertisers */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                        </div>
                        <h3>For Modern Advertisers</h3>
                        <ul>
                            
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Instant Online Booking
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Content Moderation Transparency
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Detailed Campaign Analytics
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header" style={{ textAlign: 'center' }}>
                    <span className="section-tag">The Process</span>
                    <h2>Streamlined to Perfection</h2>
                </div>
                
                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">01</div>
                        <div className="step-content">
                            <h4>Fast Onboarding</h4>
                            <p>Register in less than 2 minutes as an owner or advertiser with secure authentication.</p>
                        </div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">02</div>
                        <div className="step-content">
                            <h4>Seamless Integration</h4>
                            <p>Upload billboard documentation or explore premium placements using our smart discovery engine.</p>
                        </div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">03</div>
                        <div className="step-content">
                            <h4>Unmatched Growth</h4>
                            <p>Launch campaigns or manage inventory from a single unified dashboard with 24/7 support.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer>
                <div className="footer-top">
                    <div className="footer-brand">
                        <img src={logoImg} alt="Bimbasetu Logo" className="footer-logo-img" />
                        <p>
                            Revolutionizing out-of-home advertising through 
                            transparency, technology, and superior design.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Product</h4>
                        <ul>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#gallery">Inventory</a></li>
                            <li><Link to="/signup">Register</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Contact Us</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Legal</h4>
                        <ul>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Bimbasetu Platform. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <a href="#" className="footer-social">LinkedIn</a>
                        <a href="#" className="footer-social">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
