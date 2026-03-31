import React, { useEffect, useState } from 'react';

/**
 * Toast component — drop-in replacement for browser alert().
 *
 * Props:
 *   show     {boolean}
 *   message  {string}
 *   type     {'success' | 'error' | 'info' | 'warning'}
 *   onClose  {function}  called after auto-dismiss or X click
 *   duration {number}    ms before auto-dismiss (default 3500)
 */

const ICONS = {
    success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-5" />
        </svg>
    ),
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
    ),
    warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
};

const COLORS = {
    success: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', accent: '#D1FAE5' },
    error:   { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', accent: '#FEE2E2' },
    warning: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', accent: '#FEF3C7' },
    info:    { bg: 'linear-gradient(135deg, #667B68 0%, #4a5e4c 100%)', accent: '#d1fae5' },
};

const Toast = ({ show, message, type = 'success', onClose, duration = 3500 }) => {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (show) {
            setExiting(false);
            setVisible(true);
            const timer = setTimeout(() => dismiss(), duration);
            return () => clearTimeout(timer);
        }
    }, [show, message]);

    const dismiss = () => {
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!visible) return null;

    const { bg, accent } = COLORS[type] || COLORS.info;

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            minWidth: '300px',
            maxWidth: '420px',
            background: bg,
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '16px 18px',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: '1.5',
            animation: exiting
                ? 'toastSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards'
                : 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            backdropFilter: 'blur(8px)',
        }}>
            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(110%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0);    opacity: 1; }
                    to   { transform: translateX(110%); opacity: 0; }
                }
            `}</style>

            {/* Icon bubble */}
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                {ICONS[type]}
            </div>

            {/* Text */}
            <div style={{ flex: 1, paddingTop: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', opacity: 0.85 }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, opacity: 0.97 }}>{message}</div>
            </div>

            {/* Close button */}
            <button
                onClick={dismiss}
                style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    marginTop: '4px',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
