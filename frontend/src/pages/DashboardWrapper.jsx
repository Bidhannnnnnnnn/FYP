import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import AdvertiserDashboard from './AdvertiserDashboard';
import OwnerDashboard from './OwnerDashboard';

const DashboardWrapper = () => {
    // Use localStorage for an immediate role — no race condition
    const storedRole = localStorage.getItem('role');
    const [role, setRole] = useState(storedRole);
    const [loading, setLoading] = useState(!storedRole); // Skip loading if role already known
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Verify token is still valid and refresh role from API
        const fetchRole = async () => {
            try {
                const res = await api.get('user/profile/');
                const fetchedRole = res.data.role || storedRole || 'advertiser';
                
                // Guard: Catch inactive users who try to bypass via direct URL
                if (res.data.is_active === false) {
                    navigate('/banned', { replace: true });
                    return;
                }

                // Update localStorage in case role changed
                localStorage.setItem('role', fetchedRole);
                setRole(fetchedRole);
            } catch (error) {
                console.error("Session invalid, redirecting to login", error);
                localStorage.clear();
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, []); // Only run on mount

    // Handle path-based redirects once we know the role
    useEffect(() => {
        if (!role) return;

        const path = location.pathname;

        // Legacy /dashboard redirect → send to portal home
        if (path === '/dashboard') {
            if (role === 'business' || role === 'admin') {
                navigate('/owner', { replace: true });
            } else {
                navigate('/advertiser', { replace: true });
            }
            return;
        }

        // Allow standalone billboard and booking paths for both roles
        if (path.startsWith('/billboard') || path.startsWith('/booking') || path.startsWith('/billboard-manage')) {
            return;
        }

        // Guard: prevent owner from accessing advertiser portal
        if (path.startsWith('/advertiser') && (role === 'business' || role === 'admin')) {
            navigate('/owner', { replace: true });
            return;
        }

        // Guard: prevent advertiser from accessing owner portal
        if (path.startsWith('/owner') && role !== 'business' && role !== 'admin') {
            navigate('/advertiser', { replace: true });
            return;
        }
    }, [role, location.pathname, navigate]);

    // Show loading only if we have no role at all yet
    if (loading && !role) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #E5E7EB', borderTopColor: '#667B68', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#6B7280', fontWeight: '500' }}>Loading your portal...</p>
            </div>
        );
    }

    const path = location.pathname;

    // Render based on current path
    if (path.startsWith('/owner')) {
        return <OwnerDashboard />;
    } else if (path.startsWith('/advertiser')) {
        return <AdvertiserDashboard />;
    } else if (path.startsWith('/billboard') || path.startsWith('/booking') || path.startsWith('/billboard-manage')) {
        if (role === 'business' || role === 'admin') {
            return <OwnerDashboard />;
        } else {
            return <AdvertiserDashboard />;
        }
    }

    // Final fallback while redirect fires
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #E5E7EB', borderTopColor: '#667B68', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default DashboardWrapper;
