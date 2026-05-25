import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [verifying, setVerifying] = useState(true);
    const [bookingId, setBookingId] = useState(null);
    const [error, setError] = useState(null);
    const [needsLogin, setNeedsLogin] = useState(false);

    useEffect(() => {
        // Check for authentication token - use the same key as api.js
        const token = localStorage.getItem('accessToken');
        
        // Get payment data from URL
        const dataParam = searchParams.get('data');
        
        // Debug logging
        console.log('PaymentSuccess - Token exists:', !!token);
        console.log('PaymentSuccess - Data param exists:', !!dataParam);
        console.log('PaymentSuccess - Token value:', token ? 'exists' : 'missing');
        
        if (!dataParam) {
            setError('No payment data received from eSewa. The payment may have been cancelled.');
            setVerifying(false);
            return;
        }

        // If no token, show login prompt but don't redirect yet
        if (!token) {
            console.log('No token found - user needs to login');
            setNeedsLogin(true);
            setVerifying(false);
            // Store the payment data for after login
            sessionStorage.setItem('pending_payment_data', dataParam);
            return;
        }

        const verify = async () => {
            try {
                // Check if we have pending payment data from session storage
                const pendingData = sessionStorage.getItem('pending_payment_data');
                const paymentData = pendingData || dataParam;
                
                // Decode base64 → JSON
                console.log('Decoding payment data...');
                const decoded = JSON.parse(atob(paymentData));
                console.log('Decoded payment data:', decoded);
                console.log('Transaction UUID:', decoded.transaction_uuid);
                console.log('Total Amount:', decoded.total_amount);
                console.log('Product Code:', decoded.product_code);
                console.log('Signature from eSewa:', decoded.signature);
                console.log('Signed field names:', decoded.signed_field_names);

                // Call backend verifier
                console.log('Calling verification API...');
                const res = await api.post('campaigns/bookings/esewa/verify/', decoded);
                console.log('Verification response:', res.data);
                
                setBookingId(res.data.booking_id);
                
                // Clear pending payment data
                localStorage.removeItem('esewa_pending_booking_id');
                sessionStorage.removeItem('pending_payment_data');
            } catch (err) {
                console.error('Verification error:', err);
                console.error('Error response:', err.response?.data);
                
                // Check if it's an authentication error
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setNeedsLogin(true);
                    sessionStorage.setItem('pending_payment_data', dataParam);
                    return;
                }
                
                const msg =
                    err.response?.data?.error ||
                    err.response?.data?.detail ||
                    'Payment verification failed. Please contact support.';
                setError(msg);
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [searchParams, navigate]);

    // Show login prompt if needed
    if (needsLogin) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.card, borderTop: '4px solid #F59E0B' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔐</div>
                    <h2 style={{ ...styles.title, color: '#D97706' }}>Login Required</h2>
                    <p style={styles.subtitle}>
                        Your payment was successful, but you need to login to complete the verification.
                        Your payment data has been saved and will be processed after you login.
                    </p>
                    <div style={styles.actions}>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                ...styles.btnPrimary,
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Login to Continue
                        </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '16px 0 0 0' }}>
                        Don't worry - your payment is safe and will be verified once you login.
                    </p>
                </div>
            </div>
        );
    }

    if (verifying) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={styles.spinner} />
                    <h2 style={styles.title}>Verifying your payment…</h2>
                    <p style={styles.subtitle}>Please wait while we confirm your transaction with eSewa.</p>
                </div>
                <style>{spinnerCSS}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.card, borderTop: '4px solid #EF4444' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ ...styles.title, color: '#DC2626' }}>Verification Failed</h2>
                    <p style={styles.subtitle}>{error}</p>
                    <div style={styles.actions}>
                        <Link to="/advertiser/billing" style={styles.btnPrimary}>
                            Go to Billing
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={{ ...styles.card, borderTop: '4px solid #10B981' }}>
                {/* Animated checkmark */}
                <div style={styles.checkCircle}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                        stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <h2 style={{ ...styles.title, color: '#065F46' }}>Payment Successful!</h2>
                <p style={styles.subtitle}>
                    Your booking <strong>#{bookingId}</strong> has been confirmed and paid.
                    Your ad campaign is now active.
                </p>

                <div style={styles.infoBox}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Booking ID</span>
                        <span style={styles.infoValue}>#{bookingId}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Status</span>
                        <span style={{ ...styles.infoValue, color: '#059669', fontWeight: '700' }}>PAID</span>
                    </div>
                </div>

                <div style={styles.actions}>
                    <Link to={`/booking/${bookingId}`} style={styles.btnPrimary}>
                        View Booking Details
                    </Link>
                    <Link to="/advertiser/billing" style={styles.btnSecondary}>
                        Go to Billing
                    </Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
    },
    card: {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    },
    spinner: {
        width: '56px',
        height: '56px',
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #10B981',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 24px',
    },
    checkCircle: {
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #10B981, #059669)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#111827',
        margin: '0 0 12px 0',
    },
    subtitle: {
        fontSize: '15px',
        color: '#6B7280',
        margin: '0 0 28px 0',
        lineHeight: '1.6',
    },
    infoBox: {
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        marginBottom: '28px',
        textAlign: 'left',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
    },
    infoLabel: {
        fontSize: '13px',
        color: '#6B7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: '14px',
        color: '#111827',
        fontWeight: '600',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    btnPrimary: {
        display: 'block',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #10B981, #059669)',
        color: '#ffffff',
        borderRadius: '12px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '15px',
        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
    },
    btnSecondary: {
        display: 'block',
        padding: '14px 24px',
        background: '#F9FAFB',
        color: '#374151',
        borderRadius: '12px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '15px',
        border: '1px solid #E5E7EB',
    },
};

const spinnerCSS = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

export default PaymentSuccess;
