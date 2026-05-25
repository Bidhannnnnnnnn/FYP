import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            background: '#fff',
            borderTop: '1px solid #E5E7EB',
            borderRadius: '0 0 12px 12px'
        }}>
            {/* Items info */}
            <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                Showing <span style={{ fontWeight: '700', color: '#374151' }}>{startItem}</span> to{' '}
                <span style={{ fontWeight: '700', color: '#374151' }}>{endItem}</span> of{' '}
                <span style={{ fontWeight: '700', color: '#374151' }}>{totalItems}</span> items
            </div>

            {/* Page controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        background: currentPage === 1 ? '#F9FAFB' : '#fff',
                        color: currentPage === 1 ? '#9CA3AF' : '#374151',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (currentPage !== 1) {
                            e.currentTarget.style.background = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#667B68';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (currentPage !== 1) {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                        }
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} style={{ padding: '8px 4px', color: '#9CA3AF', fontSize: '14px' }}>
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: currentPage === page ? '1px solid #667B68' : '1px solid #E5E7EB',
                                background: currentPage === page ? '#667B68' : '#fff',
                                color: currentPage === page ? '#fff' : '#374151',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                minWidth: '40px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.background = '#F9FAFB';
                                    e.currentTarget.style.borderColor = '#667B68';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                }
                            }}
                        >
                            {page}
                        </button>
                    )
                ))}

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        background: currentPage === totalPages ? '#F9FAFB' : '#fff',
                        color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (currentPage !== totalPages) {
                            e.currentTarget.style.background = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#667B68';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (currentPage !== totalPages) {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                        }
                    }}
                >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
