import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-wrap">
            {/* Navbar */}
            <nav className="landing-nav">
                <Link to="/" className="nav-brand">Bimbasetu</Link>
                <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#how-it-works" className="nav-link">How it Works</a>
                    <a href="#about" className="nav-link">About</a>
                </div>
                <div className="nav-btns">
                    <Link to="/login" className="btn-signin">Sign In</Link>
                    <Link to="/signup" className="btn-getstarted">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #111827 0%, #064e3b 100%)',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}></div>
                    <div className="hero-pattern"></div>
                </div>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Manage Your Billboard<br />Empire with Confidence.</h1>
                    <p>Bimbasetu connects billboard owners with advertisers in one seamless platform. Track occupancy, manage bookings, and grow your revenue effortlessly.</p>
                    <div className="hero-cta-box">
                        <div className="cta-group">
                            <span className="cta-label">New to Bimbasetu?</span>
                            <Link to="/signup" className="btn-hero-primary">Create Account</Link>
                        </div>
                        <div className="cta-group">
                            <span className="cta-label">Existing User?</span>
                            <Link to="/login" className="btn-hero-secondary">Sign In</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <h2>Everything You Need</h2>
                    <p>Powerful tools designed for both billboard owners and modern advertisers.</p>
                </div>
                <div className="features-grid">
                    {/* For Owners */}
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>For Billboard Owners</h3>
                        <ul>
                            <li>Real-time Occupancy Analytics</li>
                            <li>Automated Booking Management</li>
                            <li>Dynamic Pricing Control</li>
                            <li>Revenue & Performance Reports</li>
                        </ul>
                    </div>

                    {/* For Advertisers */}
                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3>For Advertisers</h3>
                        <ul>
                            <li>Explore Premium Locations</li>
                            <li>Instant Online Booking</li>
                            <li>Campaign Performance Tracking</li>
                            <li>Flexible Duration & Scheduling</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header">
                    <h2>Three Simple Steps</h2>
                </div>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h4>Register</h4>
                        <p>Create your account as an Owner or Advertiser in minutes.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h4>Connect</h4>
                        <p>Upload your billboards or find the perfect spot for your next big campaign.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h4>Grow</h4>
                        <p>Relax as Bimbasetu handles the logistics while you focus on scaling.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer>
                <div className="footer-content">
                    <div className="footer-brand">
                        <h2>Bimbasetu</h2>
                        <p>The future of digital billboard management.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Platform</h4>
                        <ul>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/signup">Register</Link></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Bimbasetu. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
