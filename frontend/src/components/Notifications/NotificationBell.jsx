import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            console.log("Fetching notifications...");
            const res = await api.get('user/notifications/');
            console.log("Notifications received:", res.data);
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id = null) => {
        try {
            if (id) {
                await api.patch(`user/notifications/mark-read/${id}/`);
            } else {
                await api.patch('user/notifications/mark-read/');
            }
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const handleNotificationClick = async (n) => {
        if (!n.is_read) await markAsRead(n.id);
        setShowDropdown(false);

        const role = localStorage.getItem('role');
        const isAdmin = role === 'superadmin';

        if (n.notification_type === 'booking_request' || n.notification_type === 'booking_update') {
            if (n.target_id) navigate(isAdmin ? `/admin/booking/${n.target_id}` : `/booking/${n.target_id}`);
        } else if (n.notification_type === 'billboard_update') {
            if (n.target_id) navigate(isAdmin ? `/admin/billboard-detail/${n.target_id}` : `/billboard-manage/${n.target_id}`);
        }
    };

    return (
        <div className="notification-bell-container" style={{ position: 'relative' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                    padding: '8px', borderRadius: '50%', transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: '#EF4444', color: '#fff', fontSize: '10px',
                        fontWeight: '700', borderRadius: '50%', width: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div ref={dropdownRef} style={{
                    position: 'absolute', top: '50px', right: '0', width: '320px',
                    background: '#fff', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                    zIndex: 1000, overflow: 'hidden', border: '1px solid #f3f4f6'
                }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#FAFAFA'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead()}
                                style={{
                                    background: 'none', border: 'none', color: '#3B82F6',
                                    fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '16px 20px', borderBottom: '1px solid #f9fafb',
                                        cursor: 'pointer', transition: 'background 0.2s',
                                        background: n.is_read ? '#fff' : '#F0FDF4'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = n.is_read ? '#f9fafb' : '#DCFCE7'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#F0FDF4'}
                                >
                                    <div style={{ fontSize: '13px', fontWeight: n.is_read ? '400' : '600', color: '#374151', marginBottom: '4px' }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
