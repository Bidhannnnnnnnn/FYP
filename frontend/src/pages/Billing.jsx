import React, { useState, useEffect, useMemo } from 'react';
import './AdvertiserDashboard.css'; // Leverage existing dashboard styles
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/BimbasetuLogo.png';
import Pagination from '../components/Pagination';

const Billing = () => {
    const [userRole, setUserRole] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [generatingInvoice, setGeneratingInvoice] = useState(null);

    // Filters and Sorting State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest'); // Newest, Oldest, AmountHigh, AmountLow

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchRoleAndData = async () => {
            try {
                const profileRes = await api.get('user/profile/');
                const role = profileRes.data.role;
                setUserRole(role);

                let endpoint = '';
                if (role === 'advertiser') {
                    endpoint = 'campaigns/bookings/'; // My Bookings
                } else if (role === 'admin' || role === 'business') {
                    endpoint = 'campaigns/owner-bookings/'; // Owner Bookings
                } else if (role === 'superadmin') {
                    endpoint = 'campaigns/bookings/'; // Superadmin sees all
                }

                if (endpoint) {
                    const bookingsRes = await api.get(endpoint);
                    setBookings(bookingsRes.data);

                    let paidTotal = 0;
                    let pendingTotal = 0;

                    if (role === 'superadmin') {
                        // Superadmin sees only 5% platform commission
                        paidTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'paid' || b.booking_status === 'active')
                            .reduce((sum, b) => sum + parseFloat(b.platform_commission || 0), 0);

                        pendingTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'approved')
                            .reduce((sum, b) => {
                                const total = parseFloat(b.price_calculated || 0);
                                const vat = total * 13 / 113;
                                const base = total - vat;
                                const commission = base * 0.05;
                                return sum + commission;
                            }, 0);
                    } else if (role === 'admin' || role === 'business') {
                        // Billboard owners see net earnings after VAT and commission
                        paidTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'paid' || b.booking_status === 'active')
                            .reduce((sum, b) => sum + parseFloat(b.owner_payout_amount || 0), 0);

                        // Only include 'approved' bookings (exclude payment_failed)
                        pendingTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'approved')
                            .reduce((sum, b) => {
                                const total = parseFloat(b.price_calculated || 0);
                                const vat = total * 13 / 113;
                                const base = total - vat;
                                const commission = base * 0.05;
                                const ownerPayout = base - commission;
                                return sum + ownerPayout;
                            }, 0);
                    } else {
                        // Advertisers see total amount spent (only paid/active, NOT payment_failed)
                        paidTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'paid' || b.booking_status === 'active')
                            .reduce((sum, b) => sum + parseFloat(b.price_calculated || 0), 0);

                        pendingTotal = bookingsRes.data
                            .filter(b => b.booking_status === 'approved')
                            .reduce((sum, b) => sum + parseFloat(b.price_calculated || 0), 0);
                    }

                    setStats({ total: paidTotal, pending: pendingTotal });
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch billing data", err);
                setLoading(false);
            }
        };

        fetchRoleAndData();
    }, []);

    const [payingId, setPayingId] = useState(null);
    const [payErrors, setPayErrors] = useState({});

    // Compute VAT breakdown for display
    const computeVatDisplay = (total) => {
        const t = parseFloat(total || 0);
        const vat = Math.round((t * 13 / 113) * 100) / 100;
        const base = Math.round((t - vat) * 100) / 100;
        return { total: t.toFixed(2), vat: vat.toFixed(2), base: base.toFixed(2) };
    };

    const handlePayment = async (bookingId) => {
        setPayingId(bookingId);
        setPayErrors(prev => ({ ...prev, [bookingId]: null }));
        localStorage.setItem('esewa_pending_booking_id', bookingId);
        try {
            const res = await api.post(`campaigns/bookings/${bookingId}/esewa/initiate/`);
            const params = res.data;

            // Construct and auto-submit hidden-input form to eSewa
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = params.esewa_payment_url;

            const fields = [
                'amount', 'tax_amount', 'total_amount', 'transaction_uuid',
                'product_code', 'product_service_charge', 'product_delivery_charge',
                'success_url', 'failure_url', 'signed_field_names', 'signature'
            ];
            fields.forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = params[key];
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to initiate payment. Please try again.';
            setPayErrors(prev => ({ ...prev, [bookingId]: msg }));
            setPayingId(null);
        }
    };

    const handleDownloadReport = async () => {
        try {
            setDownloading(true);
            const response = await api.get('campaigns/reports/download/', { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `financial-report-${userRole}-${dateStr}.csv`);
            
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Failed to download report", error);
            alert("Failed to download report. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadInvoice = async (booking) => {
        try {
            setGeneratingInvoice(booking.id);
            const doc = new jsPDF();
            
            // 1. Logo Embedding via Base64 Canvas
            const getBase64ImageFromURL = (url) => {
                return new Promise((resolve, reject) => {
                    var img = new Image();
                    img.setAttribute("crossOrigin", "anonymous");
                    img.onload = () => {
                        var canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        var dataURL = canvas.toDataURL("image/png");
                        resolve({ dataURL, width: img.width, height: img.height });
                    };
                    img.onerror = error => reject(error);
                    img.src = url;
                });
            };

            const logoData = await getBase64ImageFromURL(logoImg);
            const targetWidth = 40;
            const targetHeight = (logoData.height / logoData.width) * targetWidth;
            doc.addImage(logoData.dataURL, 'PNG', 14, 15, targetWidth, targetHeight);

            // 2. Add Invoice Header
            doc.setFontSize(24);
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.text("INVOICE", 140, 25);
            doc.setFont("helvetica", "normal");

            // 3. Company Info
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128); // #6B7280
            doc.text("Bimbasetu Advertising Platform", 14, targetHeight + 22);
            doc.text("Kathmandu, Nepal", 14, targetHeight + 27);
            doc.text("VAT No: 123456789", 14, targetHeight + 32);

            // 4. Client / Booking Info
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.text("Billed To:", 140, targetHeight + 17);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(107, 114, 128);
            doc.text(`${localStorage.getItem('name') || 'Client Name'}`, 140, targetHeight + 22);
            doc.text(`Role: ${userRole.toUpperCase()}`, 140, targetHeight + 27);
            doc.text(`Transaction ID: #${booking.id.toString().padStart(5, '0')}`, 140, targetHeight + 32);
            doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 140, targetHeight + 37);

            // Divider Line
            doc.setDrawColor(229, 231, 235);
            doc.line(14, targetHeight + 45, 196, targetHeight + 45);

            // 5. Line Items (Table) - Role-specific breakdown
            const totalPrice = parseFloat(booking.price_calculated || 0);
            const vatAmount = parseFloat(booking.vat_amount || (totalPrice * 13 / 113));
            const basePrice = totalPrice - vatAmount;
            const platformCommission = parseFloat(booking.platform_commission || (basePrice * 0.05));
            const ownerPayout = parseFloat(booking.owner_payout_amount || (basePrice - platformCommission));

            autoTable(doc, {
                startY: targetHeight + 52,
                head: [['Description', 'Date Range', 'Status', 'Rate (NRs)', 'Amount (NRs)']],
                body: [
                    [
                        `${booking.campaign_name || 'Campaign #' + booking.campaign}\nBillboard: ${booking.billboard_title || '#' + booking.billboard}`,
                        `${booking.start_date} to ${booking.end_date}`,
                        booking.booking_status.replace('_', ' ').toUpperCase(),
                        basePrice.toFixed(2),
                        basePrice.toFixed(2)
                    ]
                ],
                theme: 'striped',
                headStyles: { fillColor: [102, 123, 104], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 10, textColor: [75, 85, 99] },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold', textColor: [31, 41, 55] },
                    3: { halign: 'right' }
                }
            });

            // 6. Totals Block - Role-specific breakdown with compact spacing
            let finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            
            let currentY = finalY;
            
            // Common breakdown for all roles
            doc.text("Subtotal (Base):", 140, currentY);
            doc.text(`NRs. ${basePrice.toFixed(2)}`, 196, currentY, { align: 'right' });
            currentY += 5;

            doc.text("VAT (13%):", 140, currentY);
            doc.text(`NRs. ${vatAmount.toFixed(2)}`, 196, currentY, { align: 'right' });
            currentY += 6;

            // Role-specific breakdown
            if (userRole === 'admin' || userRole === 'business') {
                // Billboard Owner Invoice - Show commission deduction
                doc.setTextColor(220, 38, 38);
                doc.text("Platform Commission (5%):", 140, currentY);
                doc.text(`- NRs. ${platformCommission.toFixed(2)}`, 196, currentY, { align: 'right' });
                currentY += 8;

                doc.setFontSize(10);
                doc.setTextColor(31, 41, 55);
                doc.setFont("helvetica", "bold");
                doc.text("Your Earnings:", 140, currentY);
                doc.text(`NRs. ${ownerPayout.toFixed(2)}`, 196, currentY, { align: 'right' });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                currentY += 4;
                
                doc.setTextColor(107, 114, 128);
                const subNote = doc.splitTextToSize("(Net amount after VAT & platform commission)", 56);
                doc.text(subNote, 140, currentY);
                currentY += subNote.length * 3 + 8;
                
            } else if (userRole === 'superadmin') {
                // Superadmin Invoice - Show commission earned
                doc.setTextColor(16, 185, 129);
                doc.text("Platform Commission (5%):", 140, currentY);
                doc.text(`NRs. ${platformCommission.toFixed(2)}`, 196, currentY, { align: 'right' });
                currentY += 5;

                doc.setTextColor(75, 85, 99);
                doc.text("Owner Payout (95%):", 140, currentY);
                doc.text(`NRs. ${ownerPayout.toFixed(2)}`, 196, currentY, { align: 'right' });
                currentY += 8;

                doc.setFontSize(10);
                doc.setTextColor(31, 41, 55);
                doc.setFont("helvetica", "bold");
                doc.text("Total Transaction:", 140, currentY);
                doc.text(`NRs. ${totalPrice.toFixed(2)}`, 196, currentY, { align: 'right' });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                currentY += 10;
                
            } else {
                // Advertiser Invoice - Show total paid
                currentY += 2;
                doc.setFontSize(10);
                doc.setTextColor(31, 41, 55);
                doc.setFont("helvetica", "bold");
                doc.text("Total Paid:", 140, currentY);
                doc.text(`NRs. ${totalPrice.toFixed(2)}`, 196, currentY, { align: 'right' });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                currentY += 10;
            }

            // 7. Payment Information section
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 41, 55);
            doc.text("Payment Information", 14, currentY);
            currentY += 6;
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(107, 114, 128);
            doc.text("Status: PAID & SETTLED", 14, currentY);
            currentY += 4;
            
            doc.text("Method: Bimbasetu Standard Gateway", 14, currentY);
            currentY += 4;
            
            // Role-specific payment info
            if (userRole === 'admin' || userRole === 'business') {
                doc.text(`Net Earnings: NRs. ${ownerPayout.toFixed(2)}`, 14, currentY);
                currentY += 8;
            } else if (userRole === 'superadmin') {
                doc.text(`Platform Revenue: NRs. ${platformCommission.toFixed(2)}`, 14, currentY);
                currentY += 8;
            } else {
                currentY += 8;
            }

            // 8. Terms & Conditions Box - Dynamic height based on content
            const termsBoxY = currentY;
            
            doc.setFontSize(8);
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(107, 114, 128);
            
            const maxWidth = 168;
            let termsLines = [];
            
            if (userRole === 'admin' || userRole === 'business') {
                const terms = [
                    "1. Owner earnings: 95% of base (after 13% VAT).",
                    "2. Platform retains 5% commission.",
                    "3. Payouts within 7 business days after completion.",
                    "4. Contact support within 15 days for discrepancies."
                ];
                terms.forEach(term => {
                    const lines = doc.splitTextToSize(term, maxWidth);
                    termsLines.push(...lines);
                });
            } else if (userRole === 'superadmin') {
                const terms = [
                    "1. Platform commission: 5% of base (after 13% VAT).",
                    "2. Owner receives 95% per revenue agreement.",
                    "3. Official record for platform revenue tracking.",
                    "4. Subject to Nepal jurisdiction and tax regulations."
                ];
                terms.forEach(term => {
                    const lines = doc.splitTextToSize(term, maxWidth);
                    termsLines.push(...lines);
                });
            } else {
                const terms = [
                    "1. All sales final. Standard grace periods apply.",
                    "2. Contact support within 15 days for discrepancies.",
                    "3. Electronic invoice serves as proof of transaction.",
                    "4. Subject to Nepal electronic commerce mandates."
                ];
                terms.forEach(term => {
                    const lines = doc.splitTextToSize(term, maxWidth);
                    termsLines.push(...lines);
                });
            }
            
            const termsBoxHeight = 8 + (termsLines.length * 3.5) + 4;
            
            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(243, 244, 246);
            doc.roundedRect(14, termsBoxY, 182, termsBoxHeight, 3, 3, 'FD');
            
            doc.setFontSize(8);
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.text("Terms & Conditions", 20, termsBoxY + 6);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(107, 114, 128);
            
            let termY = termsBoxY + 11;
            termsLines.forEach(line => {
                doc.text(line, 20, termY);
                termY += 3.5;
            });

            // 9. Legal Disclaimer Footer
            doc.setFontSize(7);
            doc.setTextColor(156, 163, 175);
            const footerText = userRole === 'admin' || userRole === 'business' 
                ? "Thank you for partnering with Bimbasetu. Computer generated earnings statement."
                : userRole === 'superadmin'
                ? "Bimbasetu Platform Revenue Statement - Computer Generated"
                : "Thank you for advertising with Bimbasetu. Computer generated invoice.";
            const footerLines = doc.splitTextToSize(footerText, 180);
            doc.text(footerLines, 105, 280, { align: 'center' });

            // 10. Stream the PDF Output with role-specific filename
            const docType = userRole === 'admin' || userRole === 'business' ? 'Earnings' : userRole === 'superadmin' ? 'Revenue' : 'Invoice';
            doc.save(`${docType}_${booking.id}_${booking.start_date}.pdf`);
            
        } catch (error) {
            console.error("Failed to generate invoice", error);
            alert("Failed to generate invoice. Please try again.");
        } finally {
            setGeneratingInvoice(null);
        }
    };

    // Derived states (Filtering + Sorting)
    const processedBookings = useMemo(() => {
        let result = [...bookings];

        // 1. Search Filter
        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase();
            result = result.filter(b =>
                (b.id && b.id.toString().includes(query)) ||
                (b.campaign_name && b.campaign_name.toLowerCase().includes(query)) ||
                (b.billboard_title && b.billboard_title.toLowerCase().includes(query)) ||
                (b.campaign && typeof b.campaign === 'string' && b.campaign.toLowerCase().includes(query)) ||
                (b.billboard && typeof b.billboard === 'string' && b.billboard.toLowerCase().includes(query))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(b => {
                const normalizedStatus = b.booking_status.replace('_', ' ').toLowerCase();
                return normalizedStatus === statusFilter.toLowerCase();
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'Newest') {
                return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
            } else if (sortBy === 'Oldest') {
                return new Date(a.created_at || a.start_date) - new Date(b.created_at || b.start_date);
            } else if (sortBy === 'AmountHigh') {
                return parseFloat(b.price_calculated || 0) - parseFloat(a.price_calculated || 0);
            } else if (sortBy === 'AmountLow') {
                return parseFloat(a.price_calculated || 0) - parseFloat(b.price_calculated || 0);
            }
            return 0;
        });

        return result;
    }, [bookings, searchTerm, statusFilter, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(processedBookings.length / itemsPerPage);
    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedBookings.slice(startIndex, startIndex + itemsPerPage);
    }, [processedBookings, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);


    const getRoleLabels = () => {
        if (userRole === 'advertiser') {
            return { totalLabel: 'Total Amount Spent', pendingLabel: 'Pending Payments (Approved)' };
        } else if (userRole === 'superadmin') {
            return { totalLabel: 'Total Platform Revenue', pendingLabel: 'Pending Platform Revenue' };
        } else {
            return { totalLabel: 'Total Earnings', pendingLabel: 'Pending Earnings' };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: '#667B68', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    Loading Finances...
                </div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const { totalLabel, pendingLabel } = getRoleLabels();

    return (
        <div className="view-container" style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '32px', color: '#1F2937', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>Billing & Payments</h1>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '16px' }}>Comprehensive overview of all your financial transactions.</p>
                </div>
            </div>

            {/* Financial Stats Row */}
            <div className="stats-row" style={{ marginBottom: '32px' }}>
                <div className="stat-card primary-stat" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div className="stat-content" style={{ position: 'relative', zIndex: 1 }}>
                        <span className="stat-label" style={{ fontSize: '14px', opacity: 0.9 }}>{totalLabel}</span>
                        <div className="stat-value" style={{ fontSize: '36px', marginTop: '4px' }}>NRs. {Math.round(stats.total).toLocaleString()}</div>
                    </div>
                    <svg style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.1, width: '120px', height: '120px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="stat-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div className="stat-content" style={{ position: 'relative', zIndex: 1 }}>
                        <span className="stat-label" style={{ fontSize: '14px' }}>{pendingLabel}</span>
                        <div className="stat-value" style={{ fontSize: '36px', marginTop: '4px', color: '#1F2937' }}>NRs. {Math.round(stats.pending).toLocaleString()}</div>
                    </div>
                    <svg style={{ position: 'absolute', right: '10px', bottom: '10px', color: '#F3F4F6', width: '80px', height: '80px', zIndex: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
            </div>

            {/* Controls Row (Search, Filter, Sort) */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ position: 'relative', minWidth: '300px', flexGrow: 1, maxWidth: '400px' }}>
                    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        type="text"
                        placeholder="Search by ID, Campaign, or Billboard..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667B68'}
                        onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Active">Active</option>
                            <option value="Approved">Approved (Pending Payment)</option>
                            <option value="Pending">Pending Approval</option>
                            <option value="Changes Requested">Changes Requested</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Sort:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer' }}
                        >
                            <option value="Newest">Date: Newest First</option>
                            <option value="Oldest">Date: Oldest First</option>
                            <option value="AmountHigh">Amount: High to Low</option>
                            <option value="AmountLow">Amount: Low to High</option>
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '28px', background: '#E5E7EB', margin: '0 4px' }}></div>

                    <button 
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: downloading ? '#E5E7EB' : 'var(--admin-primary-green, #667B68)',
                            color: downloading ? '#9CA3AF' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {downloading ? (
                            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        )}
                        {downloading ? 'Preparing...' : 'CSV Report'}
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container" style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (NRs)</th>
                            <th style={{ padding: '16px 20px', textAlign: 'left', color: '#4B5563', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBookings.map((b) => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                                <td style={{ padding: '16px 20px', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                                    #{b.id.toString().padStart(5, '0')}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>{b.campaign_name || `Campaign #${b.campaign}`}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                                        {b.billboard_title || `Billboard #${b.billboard}`}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ color: '#374151', fontSize: '14px' }}>{b.start_date}</div>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>to {b.end_date}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-block',
                                        backgroundColor:
                                            ['paid', 'active'].includes(b.booking_status) ? '#D1FAE5' :
                                                b.booking_status === 'approved' ? '#FEF3C7' :
                                                    b.booking_status === 'rejected' ? '#FEE2E2' : '#F3F4F6',
                                        color:
                                            ['paid', 'active'].includes(b.booking_status) ? '#065F46' :
                                                b.booking_status === 'approved' ? '#92400E' :
                                                    b.booking_status === 'rejected' ? '#991B1B' : '#374151',
                                    }}>
                                        {b.booking_status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                                    {(() => {
                                        const total = parseFloat(b.price_calculated || 0);
                                        if (userRole === 'superadmin') {
                                            // Show only platform commission
                                            const commission = parseFloat(b.platform_commission || 0);
                                            return commission.toLocaleString();
                                        } else if (userRole === 'admin' || userRole === 'business') {
                                            // Show net earnings after VAT and commission
                                            const ownerPayout = parseFloat(b.owner_payout_amount || 0);
                                            return ownerPayout.toLocaleString();
                                        } else {
                                            // Advertiser sees total
                                            return total.toLocaleString();
                                        }
                                    })()}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {b.booking_status === 'approved' && userRole === 'advertiser' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {/* VAT breakdown */}
                                                {(() => {
                                                    const vat = computeVatDisplay(b.price_calculated);
                                                    return (
                                                        <div style={{ fontSize: '11px', color: '#92400E', lineHeight: '1.5' }}>
                                                            <span>Base: NRs. {vat.base}</span>
                                                            <span style={{ margin: '0 4px', color: '#D1D5DB' }}>|</span>
                                                            <span>VAT: NRs. {vat.vat}</span>
                                                        </div>
                                                    );
                                                })()}
                                                {payErrors[b.id] && (
                                                    <div style={{ fontSize: '11px', color: '#DC2626' }}>{payErrors[b.id]}</div>
                                                )}
                                                <button
                                                    onClick={() => handlePayment(b.id)}
                                                    disabled={payingId === b.id}
                                                    style={{
                                                        padding: '8px 16px',
                                                        fontSize: '13px',
                                                        background: payingId === b.id ? '#9CA3AF' : '#667B68',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: payingId === b.id ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        boxShadow: payingId === b.id ? 'none' : '0 2px 4px rgba(102, 123, 104, 0.2)'
                                                    }}
                                                >
                                                    {payingId === b.id ? (
                                                        <>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                                            Redirecting…
                                                        </>
                                                    ) : (
                                                        <>💳 Pay with eSewa</>
                                                    )}
                                                </button>
                                            </div>
                                        ) : ['paid', 'active'].includes(b.booking_status) ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: '600', fontSize: '13px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Settled
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>
                                        )}
                                        
                                        {/* Download PDF Invoice Hook */}
                                        {['paid', 'active'].includes(b.booking_status) && (
                                            <button
                                                onClick={() => handleDownloadInvoice(b)}
                                                disabled={generatingInvoice === b.id}
                                                title="Download Invoice PDF"
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'transparent',
                                                    border: '1px solid #D1D5DB',
                                                    borderRadius: '6px',
                                                    color: '#4B5563',
                                                    cursor: generatingInvoice === b.id ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onMouseEnter={(e) => { if (generatingInvoice !== b.id) { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#9CA3AF'; } }}
                                                onMouseLeave={(e) => { if (generatingInvoice !== b.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D1D5DB'; } }}
                                            >
                                                {generatingInvoice === b.id ? (
                                                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path></svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedBookings.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                                    <svg style={{ display: 'block', margin: '0 auto 16px', color: '#D1D5DB' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#4B5563', marginBottom: '4px' }}>No transactions found</div>
                                    <div style={{ fontSize: '14px' }}>We couldn't find any financial records matching your filters.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {processedBookings.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={processedBookings.length}
                />
            )}
        </div>
    );
};

export default Billing;
