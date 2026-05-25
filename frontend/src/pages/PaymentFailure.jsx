import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const PaymentFailure = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Try to recover booking_id from location state or localStorage
    const bookingId =
        location.state?.booking_id ||
        localStorage.getItem('esewa_pending_booking_id');

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Icon */}
                <div style={styles.iconCircle}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                        stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </div>

                <h2 style={styles.title}>Payment Not Completed</h2>
                <p style={styles.subtitle}>
                    Your payment was cancelled or could not be processed.
                    Don't worry — your booking is still <strong>approved</strong> and
                    you can try again before the payment deadline.
                </p>

                <div style={styles.infoBox}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Booking Status</span>
                        <span style={{ ...styles.infoValue, color: '#D97706', fontWeight: '700' }}>
                            APPROVED — Awaiting Payment
                        </span>
                    </div>
                    {bookingId && (
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Booking ID</span>
                            <span style={styles.infoValue}>#{bookingId}</span>
                        </div>
                    )}
                </div>

                <div style={styles.actions}>
                    {bookingId ? (
                        <Link to={`/booking/${bookingId}`} style={styles.btnPrimary}>
                            Try Again
                        </Link>
                    ) : (
                        <Link to="/advertiser/my-bookings" style={styles.btnPrimary}>
                            View My Bookings
                        </Link>
                    )}
                    <Link to="/advertiser/billing" style={styles.btnSecondary}>
                        Go to Billing
                    </Link>
                </div>

                <p style={styles.note}>
                    If you were charged but the booking wasn't confirmed, please contact support.
                </p>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
    },
    card: {
        background: '#ffffff',
        borderRadius: '20px',
        borderTop: '4px solid #F59E0B',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    },
    iconCircle: {
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
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
        background: '#FFFBEB',
        borderRadius: '12px',
        border: '1px solid #FDE68A',
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
        color: '#92400E',
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
        marginBottom: '20px',
    },
    btnPrimary: {
        display: 'block',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        color: '#ffffff',
        borderRadius: '12px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '15px',
        boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
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
    note: {
        fontSize: '12px',
        color: '#9CA3AF',
        margin: 0,
    },
};

export default PaymentFailure;
