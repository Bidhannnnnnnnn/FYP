import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdvertiserDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="brand-section">
                    <h2>BimbaSetu</h2>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className="active">
                            <span className="nav-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </span>
                            <span className="nav-text">Dashboard</span>
                        </li>
                        <li>
                            <span className="nav-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                            </span>
                            <span className="nav-text">Explore Billboards</span>
                        </li>
                        <li>
                            <span className="nav-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </span>
                            <span className="nav-text">My Ads</span>
                        </li>
                        <li>
                            <span className="nav-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            <span className="nav-text">Historic Ads</span>
                        </li>
                        <li>
                            <span className="nav-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <span className="nav-text">My Account</span>
                        </li>
                    </ul>
                </nav>

                {/* Logout at bottom of sidebar often looks better, but design puts it in header. I'll stick to header for now per design. */}
            </div>

            {/* Main Content */}
            <div className="main-content">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Hi, Bidhan</h1>
                        <p>Here's what's happening with your campaigns today.</p>
                    </div>
                    <div className="header-right">
                        <div className="search-bar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" placeholder="Search..." />
                        </div>
                        <div className="icon-group">
                            <span className="icon-btn notif-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                <span className="notification-dot"></span>
                            </span>
                        </div>
                        <button className="logout-btn" onClick={() => navigate('/login')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                <div className="stats-row">
                    <div className="stat-card primary-stat">
                        <div className="stat-content">
                            <span className="stat-label">Total Reach</span>
                            <div className="stat-value">350</div>
                        </div>
                        <div className="stat-icon-bg">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <span className="stat-label">Active Billboards</span>
                            <div className="stat-value">7</div>
                        </div>
                        <div className="stat-icon-bg">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <span className="stat-label">Invested Today</span>
                            <div className="stat-value">$198</div>
                        </div>
                        <div className="stat-icon-bg">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="analytics-section">
                    <div className="analytics-header">
                        <h3>Analytics Overview</h3>
                        <div className="analytics-actions">
                            <button className="period-btn active">Week</button>
                            <button className="period-btn">Month</button>
                            <button className="period-btn">Year</button>
                        </div>
                    </div>
                    <div className="analytics-chart-container">
                        {/* Mock Chart using CSS/SVG for visual appeal */}
                        <svg className="mock-chart" viewBox="0 0 1000 200" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#667B68" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#667B68" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,150 Q100,100 200,120 T400,80 T600,100 T800,40 T1000,80 V200 H0 Z" fill="url(#chartGradient)" />
                            <path d="M0,150 Q100,100 200,120 T400,80 T600,100 T800,40 T1000,80" fill="none" stroke="#667B68" strokeWidth="3" />
                            {/* Data Points */}
                            <circle cx="200" cy="120" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                            <circle cx="400" cy="80" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                            <circle cx="600" cy="100" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                            <circle cx="800" cy="40" r="4" fill="#fff" stroke="#667B68" strokeWidth="2" />
                        </svg>
                        <div className="chart-labels">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvertiserDashboard;
