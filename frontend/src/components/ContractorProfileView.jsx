import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import '../style/contractors.css';

const ContractorProfileView = () => {
    const { id: contractorId } = useParams();
    const navigate = useNavigate();

    const [contractor, setContractor] = useState(null);
    const [works, setWorks] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ledgerFilter, setLedgerFilter] = useState('ALL'); // 'ALL' | 'WORKS' | 'PAYMENTS'

    useEffect(() => {
        if (contractorId) {
            fetchContractorData();
        }
    }, [contractorId]);

    const fetchContractorData = async () => {
        setLoading(true);
        try {
            const [cRes, wRes, pRes] = await Promise.all([
                axiosInstance.get(`../contractors/contractors/${contractorId}/`),
                axiosInstance.get(`../contractors/work/?contractor=${contractorId}`),
                axiosInstance.get(`../contractors/payments/?contractor=${contractorId}`)
            ]);
            setContractor(cRes.data);
            setWorks(wRes.data || []);
            setPayments(pRes.data || []);
        } catch (err) {
            console.error('Error fetching contractor profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="contractors-container" style={{ textAlign: 'center', padding: '4rem' }}>
                <p style={{ color: '#64748B' }}>Loading contractor profile dashboard...</p>
            </div>
        );
    }

    if (!contractor) {
        return (
            <div className="contractors-container" style={{ textAlign: 'center', padding: '4rem' }}>
                <h3>Contractor not found</h3>
                <Link to="/contractors" className="btn-action-sm" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    ← Back to Contractors Directory
                </Link>
            </div>
        );
    }

    const fullName = `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() || contractor.email;

    // Financial calculations for Payments Dashboard
    const totalBilled = works.reduce((sum, w) => sum + (parseFloat(w.total_payment) || 0), 0);
    const totalTds = works.reduce((sum, w) => sum + (parseFloat(w.tds_amount) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const outstandingBalance = Math.max(0, totalBilled - totalPaid);

    // Build unified ledger list
    const ledgerItems = [];

    works.forEach(w => {
        ledgerItems.push({
            id: `work-${w.id}`,
            date: w.start_date || w.created_at?.split('T')[0] || 'N/A',
            type: 'WORK_INVOICE',
            description: w.work_description || `Work Assignment #${w.id}`,
            method: w.work_type,
            grossAmount: parseFloat(w.gross_amount) || 0,
            tdsAmount: parseFloat(w.tds_amount) || 0,
            netAmount: parseFloat(w.total_payment) || 0,
            direction: 'CREDIT', // Money earned by contractor
            status: w.work_status,
            rawDate: new Date(w.start_date || w.created_at || '1970-01-01')
        });
    });

    payments.forEach(p => {
        ledgerItems.push({
            id: `pay-${p.id}`,
            date: p.payment_date || p.created_at?.split('T')[0] || 'N/A',
            type: 'PAYMENT_OUT',
            description: `Payment Payout for ${p.work_description || 'Work'}`,
            method: p.payment_method,
            grossAmount: parseFloat(p.amount) || 0,
            tdsAmount: 0,
            netAmount: parseFloat(p.amount) || 0,
            direction: 'DEBIT', // Money paid out to contractor
            status: p.payment_status,
            rawDate: new Date(p.payment_date || p.created_at || '1970-01-01')
        });
    });

    // Sort ledger items chronologically
    ledgerItems.sort((a, b) => b.rawDate - a.rawDate);

    // Filter ledger items
    const filteredLedger = ledgerItems.filter(item => {
        if (ledgerFilter === 'WORKS') return item.type === 'WORK_INVOICE';
        if (ledgerFilter === 'PAYMENTS') return item.type === 'PAYMENT_OUT';
        return true;
    });

    return (
        <div className="contractors-container">
            {/* Navigation Header */}
            <header className="ctr-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/contractors" className="btn-action-sm">
                        ← Back
                    </Link>
                    <div className="ctr-title-group">
                        <h1>
                            {fullName}
                            <span className="ctr-badge">Contractor Profile</span>
                        </h1>
                        <p>{contractor.company_name ? `${contractor.company_name} • ` : ''}{contractor.email}</p>
                    </div>
                </div>
            </header>

            {/* Contractor Profile Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="ctr-info-box">
                    <h4>Personal & Contact Information</h4>
                    <div className="ctr-info-row">
                        <span className="label">Full Name:</span>
                        <span className="val">{fullName}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">Email Address:</span>
                        <span className="val">{contractor.email}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">Primary Phone:</span>
                        <span className="val">{contractor.phone_number || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">Business Phone:</span>
                        <span className="val">{contractor.buisness_contact_number || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">Address:</span>
                        <span className="val">{contractor.address || 'N/A'}</span>
                    </div>
                </div>

                <div className="ctr-info-box">
                    <h4>Tax & Financial Setup</h4>
                    <div className="ctr-info-row">
                        <span className="label">PAN Number:</span>
                        <span className="val">{contractor.pan_number || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">TAN Number:</span>
                        <span className="val">{contractor.tan_number || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">Bank Account Number:</span>
                        <span className="val">{contractor.bank_account_number || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">IFSC Code:</span>
                        <span className="val">{contractor.ifsc_code || 'N/A'}</span>
                    </div>
                    <div className="ctr-info-row">
                        <span className="label">UPI ID:</span>
                        <span className="val">{contractor.upi_id || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Payments Dashboard Stat Cards */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                Payments Dashboard
            </h2>

            <div className="ctr-stats-grid">
                <div className="ctr-stat-card dark-emerald">
                    <div className="ctr-stat-label">Total Net Billed</div>
                    <div className="ctr-stat-value">₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="ctr-stat-sub">From {works.length} Contract Work Assignments</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Total Disbursed</div>
                    <div className="ctr-stat-value" style={{ color: '#059669' }}>
                        ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="ctr-stat-sub" style={{ color: '#059669' }}>Total Payouts Released</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Outstanding Balance</div>
                    <div className="ctr-stat-value" style={{ color: outstandingBalance > 0 ? '#D97706' : '#059669' }}>
                        ₹{outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="ctr-stat-sub" style={{ color: '#64748B' }}>Net Payable Amount</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Total TDS Deducted</div>
                    <div className="ctr-stat-value" style={{ color: '#6366F1' }}>
                        ₹{totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="ctr-stat-sub" style={{ color: '#64748B' }}>Withheld Tax</div>
                </div>
            </div>

            {/* Contractor Ledger Table */}
            <div className="ledger-table-card">
                <div className="ledger-table-header">
                    <h3>Account Statement & Ledger</h3>
                    <div className="ms-selector-group">
                        <button 
                            className={`ms-select-box ${ledgerFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setLedgerFilter('ALL')}
                        >
                            All Transactions
                        </button>
                        <button 
                            className={`ms-select-box ${ledgerFilter === 'WORKS' ? 'active' : ''}`}
                            onClick={() => setLedgerFilter('WORKS')}
                        >
                            Works Only
                        </button>
                        <button 
                            className={`ms-select-box ${ledgerFilter === 'PAYMENTS' ? 'active' : ''}`}
                            onClick={() => setLedgerFilter('PAYMENTS')}
                        >
                            Payments Only
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="ctr-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Transaction Type</th>
                                <th>Description / Method</th>
                                <th>Gross / Billed</th>
                                <th>TDS</th>
                                <th>Net Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLedger.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                                        No ledger transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                filteredLedger.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.date}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: '0.76rem', 
                                                fontWeight: 800, 
                                                padding: '0.2rem 0.6rem', 
                                                borderRadius: '6px',
                                                background: item.direction === 'CREDIT' ? '#EFF6FF' : '#ECFDF5',
                                                color: item.direction === 'CREDIT' ? '#1D4ED8' : '#047857'
                                            }}>
                                                {item.type === 'WORK_INVOICE' ? 'WORK INVOICE' : 'PAYMENT DISBURSED'}
                                            </span>
                                        </td>
                                        <td>{item.description}</td>
                                        <td>₹{item.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ color: item.tdsAmount > 0 ? '#6366F1' : '#94A3B8' }}>
                                            ₹{item.tdsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ fontWeight: 800, color: item.direction === 'CREDIT' ? '#0F172A' : '#059669' }}>
                                            {item.direction === 'DEBIT' ? '- ' : ''}₹{item.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${item.status}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ContractorProfileView;
