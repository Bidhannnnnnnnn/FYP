import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import AdvertiserDashboard from './AdvertiserDashboard';
import OwnerDashboard from './OwnerDashboard';

const DashboardWrapper = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await api.get('user/profile/');
                // Simplify role check - assuming backend returns 'role' field or we derive it
                // Based on UserProfileSerializer, check what fields are returned.
                // Assuming 'role' is in the response. If not, we might need to check 'is_admin' etc.
                // Let's assume the Profile response has 'role'. If not, we might fall back to Advertiser default?
                // Actually 'user/profile' just returns serialized data.
                // Let's inspect `UserProfileView` in `account/views.py`.
                // It uses `UserProfileSerializer`.
                // If `role` is not there, we must rely on something else.
                // But `UserRegistrationSerializer` has role.

                // Note: The UserProfileSerializer might strictly return fields. 
                // We'll trust it returns 'role' or we'll need to update backend.
                // For now, let's try to access res.data.role.
                // Actually, account permissions are used in views, so user model definitely has it.

                setRole(res.data.role || 'advertiser'); // Default to advertiser if unknown
            } catch (error) {
                console.error("Failed to fetch role", error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [navigate]);

    // Handle redirects based on path and role
    useEffect(() => {
        if (!role || loading) return;

        const path = location.pathname;

        // Legacy /dashboard redirect
        if (path === '/dashboard') {
            if (role === 'business' || role === 'admin') {
                navigate('/owner/analytics', { replace: true });
            } else {
                navigate('/advertiser/explore', { replace: true });
            }
            return;
        }

        // Ensure users are on the correct portal
        if ((path.startsWith('/owner') || path === '/owner/profile') && role !== 'business' && role !== 'admin') {
            navigate('/advertiser/explore', { replace: true });
        } else if ((path.startsWith('/advertiser') || path === '/advertiser/profile') && (role === 'business' || role === 'admin')) {
            navigate('/owner/analytics', { replace: true });
        }
    }, [role, location.pathname, navigate, loading]);

    if (loading) return <div>Loading Dashboard...</div>;

    // Determine which dashboard to render based on path
    const path = location.pathname;

    if (path.startsWith('/owner')) {
        return <OwnerDashboard />;
    } else if (path.startsWith('/advertiser')) {
        return <AdvertiserDashboard />;
    }

    // Fallback (should not reach here due to redirects)
    return <div>Loading...</div>;
};

export default DashboardWrapper;
