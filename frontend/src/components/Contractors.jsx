import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import '../style/contractors.css';

const WORK_TYPE_OPTIONS = [
    { value: 'HOURLY', label: 'Hourly' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'PROJECT_BASED', label: 'Project Based' },
    { value: 'MILESTONE_BASED', label: 'Milestone Based' },
    { value: 'RETAINER', label: 'Retainer' },
    { value: 'PIECE_RATE', label: 'Piece / Unit Rate' },
    { value: 'COMMISSION', label: 'Commission Based' },
    { value: 'HYBRID', label: 'Hybrid' },
];

const WORK_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_METHOD_OPTIONS = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'CASH', label: 'Cash' },
    { value: 'OTHER', label: 'Other' },
];

const Contractors = () => {
    const navigate = useNavigate();
    const { userProfile } = useContext(AuthContext);

    const [contractors, setContractors] = useState([]);
    const [works, setWorks] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedContractorIds, setExpandedContractorIds] = useState([]);

    // FAB & Modal state
    const [fabOpen, setFabOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'ADD_CONTRACTOR' | 'ADD_WORK' | 'ADD_PAYMENT'
    const [modalError, setModalError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form data states
    const [contractorForm, setContractorForm] = useState({
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone_number: '',
        work_type: 'PROJECT_BASED',
        pan_number: '',
        tan_number: '',
        bank_account_number: '',
        ifsc_code: '',
        upi_id: '',
        address: ''
    });

    const [workForm, setWorkForm] = useState({
        contractor: '',
        work_type: 'PROJECT_BASED',
        payment_type: 'PROJECT_BASED',
        work_description: '',
        work_status: 'PENDING',
        start_date: '',
        end_date: '',
        rate: '0.00',
        units_worked: '1.00',
        misc_charges: '0.00',
        tds_percentage: '0.00'
    });

    const [paymentForm, setPaymentForm] = useState({
        contractor: '',
        work: '',
        amount: '0.00',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'BANK_TRANSFER',
        payment_status: 'COMPLETED'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, wRes, pRes] = await Promise.all([
                axiosInstance.get('../contractors/contractors/'),
                axiosInstance.get('../contractors/work/'),
                axiosInstance.get('../contractors/payments/')
            ]);
            setContractors(cRes.data || []);
            setWorks(wRes.data || []);
            setPayments(pRes.data || []);
        } catch (err) {
            console.error('Error fetching contractors data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAccordion = (id) => {
        setExpandedContractorIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Filter contractors by search
    const filteredContractors = contractors.filter(c => {
        const query = searchQuery.toLowerCase();
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const company = (c.company_name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        return fullName.includes(query) || company.includes(query) || email.includes(query);
    });

    // Stats calculations
    const totalContractors = contractors.length;
    const totalWorkCount = works.length;
    const totalBilled = works.reduce((sum, w) => sum + (parseFloat(w.total_payment) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Helper to format DRF errors
    const extractErrorMessage = (err, defaultMsg) => {
        if (!err.response?.data) return defaultMsg;
        const data = err.response.data;
        if (typeof data === 'string') return data;
        if (data.detail) return data.detail;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
            const val = data[firstKey];
            const msg = Array.isArray(val) ? val[0] : val;
            return `${firstKey.replace('_', ' ')}: ${msg}`;
        }
        return defaultMsg;
    };

    // Handlers for modal forms
    const handleAddContractorSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setModalError(null);
        try {
            await axiosInstance.post('../contractors/contractors/', contractorForm);
            await fetchData();
            setActiveModal(null);
            setContractorForm({
                first_name: '', last_name: '', company_name: '', email: '',
                phone_number: '', work_type: 'PROJECT_BASED', pan_number: '',
                tan_number: '', bank_account_number: '', ifsc_code: '', upi_id: '', address: ''
            });
        } catch (err) {
            setModalError(extractErrorMessage(err, 'Error adding contractor profile. Check fields.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddWorkSubmit = async (e) => {
        e.preventDefault();
        if (!workForm.contractor) {
            setModalError('Please select a contractor');
            return;
        }
        setSubmitting(true);
        setModalError(null);
        try {
            await axiosInstance.post('../contractors/work/', workForm);
            await fetchData();
            setActiveModal(null);
            setWorkForm({
                contractor: '', work_type: 'PROJECT_BASED', payment_type: 'PROJECT_BASED',
                work_description: '', work_status: 'PENDING', start_date: '', end_date: '',
                rate: '0.00', units_worked: '1.00', misc_charges: '0.00', tds_percentage: '0.00'
            });
        } catch (err) {
            setModalError(extractErrorMessage(err, 'Error creating work assignment.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddPaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentForm.contractor || !paymentForm.work) {
            setModalError('Please select a contractor and linked work item');
            return;
        }
        setSubmitting(true);
        setModalError(null);
        try {
            await axiosInstance.post('../contractors/payments/', paymentForm);
            await fetchData();
            setActiveModal(null);
            setPaymentForm({
                contractor: '', work: '', amount: '0.00',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'BANK_TRANSFER', payment_status: 'COMPLETED'
            });
        } catch (err) {
            setModalError(extractErrorMessage(err, 'Error recording payment.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get works for a specific contractor
    const getContractorWorks = (contractorId) => {
        return works.filter(w => w.contractor === contractorId);
    };

    const openAddWorkForContractor = (contractorId) => {
        setWorkForm(prev => ({ ...prev, contractor: contractorId }));
        setActiveModal('ADD_WORK');
    };

    return (
        <div className="contractors-container">
            {/* Header */}
            <header className="ctr-header">
                <div className="ctr-title-group">
                    <h1>
                        Contractors Directory
                        <span className="ctr-badge">Active RLS</span>
                    </h1>
                    <p>Manage contractor profiles, deliverables, timeline milestones, and payouts.</p>
                </div>
            </header>

            {/* Dashboard Stats */}
            <div className="ctr-stats-grid">
                <div className="ctr-stat-card dark-emerald">
                    <div className="ctr-stat-label">
                        Total Contractors
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="ctr-stat-value">{totalContractors}</div>
                    <div className="ctr-stat-sub">{totalWorkCount} Active Works Assigned</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Total Net Billed</div>
                    <div className="ctr-stat-value">₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="ctr-stat-sub" style={{ color: '#059669' }}>Calculated Net Work Payouts</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Total Disbursed Payouts</div>
                    <div className="ctr-stat-value">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="ctr-stat-sub" style={{ color: '#2563EB' }}>Recorded Payments</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Outstanding Balance</div>
                    <div className="ctr-stat-value" style={{ color: (totalBilled - totalPaid) > 0 ? '#D97706' : '#059669' }}>
                        ₹{Math.max(0, totalBilled - totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="ctr-stat-sub" style={{ color: '#64748B' }}>Unpaid Invoices</div>
                </div>
            </div>

            {/* Toolbar Search */}
            <div className="ctr-toolbar">
                <div className="ctr-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input 
                        type="text" 
                        className="ctr-search-input" 
                        placeholder="Search contractor by name, company, or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Contractor Accordion List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    Loading contractors list...
                </div>
            ) : filteredContractors.length === 0 ? (
                <div style={{ background: '#FFFFFF', padding: '3rem', textAlign: 'center', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>No contractors found</h3>
                    <p style={{ color: '#64748B' }}>Click the green action button on the bottom right to create your first contractor profile.</p>
                </div>
            ) : (
                <div className="ctr-card-list">
                    {filteredContractors.map(contractor => {
                        const isOpen = expandedContractorIds.includes(contractor.id);
                        const cWorks = getContractorWorks(contractor.id);
                        const fullName = `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim() || contractor.email;

                        return (
                            <div key={contractor.id} className={`ctr-accordion-card ${isOpen ? 'open' : ''}`}>
                                {/* Accordion Header */}
                                <div className="ctr-accordion-header" onClick={() => toggleAccordion(contractor.id)}>
                                    <div className="ctr-user-info">
                                        <div className="ctr-avatar">
                                            {(fullName[0] || 'C').toUpperCase()}
                                        </div>
                                        <div className="ctr-name-details">
                                            <h3>{fullName}</h3>
                                            <p>{contractor.company_name ? `${contractor.company_name} • ` : ''}{contractor.email}</p>
                                        </div>
                                    </div>

                                    <div className="ctr-header-meta">
                                        <span className={`ctr-pill ${contractor.work_type || 'DEFAULT'}`}>
                                            {(contractor.work_type || 'Project Based').replace('_', ' ')}
                                        </span>
                                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748B' }}>
                                            {cWorks.length} {cWorks.length === 1 ? 'Work' : 'Works'}
                                        </span>
                                        <svg className="ctr-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                </div>

                                {/* Accordion Body */}
                                {isOpen && (
                                    <div className="ctr-accordion-body">
                                        <div className="ctr-body-grid">
                                            {/* Profile Info Box */}
                                            <div className="ctr-info-box">
                                                <h4>
                                                    Contractor Details
                                                    <Link to={`/contractors/${contractor.id}`} className="btn-action-sm">
                                                        View Profile & Ledger →
                                                    </Link>
                                                </h4>
                                                <div className="ctr-info-row">
                                                    <span className="label">Phone:</span>
                                                    <span className="val">{contractor.phone_number || 'N/A'}</span>
                                                </div>
                                                <div className="ctr-info-row">
                                                    <span className="label">PAN Number:</span>
                                                    <span className="val">{contractor.pan_number || 'N/A'}</span>
                                                </div>
                                                <div className="ctr-info-row">
                                                    <span className="label">TAN Number:</span>
                                                    <span className="val">{contractor.tan_number || 'N/A'}</span>
                                                </div>
                                                <div className="ctr-info-row">
                                                    <span className="label">Bank Account:</span>
                                                    <span className="val">{contractor.bank_account_number || 'N/A'}</span>
                                                </div>
                                                <div className="ctr-info-row">
                                                    <span className="label">UPI ID:</span>
                                                    <span className="val">{contractor.upi_id || 'N/A'}</span>
                                                </div>
                                            </div>

                                            {/* Works List Box */}
                                            <div className="ctr-works-box">
                                                <div className="ctr-works-header">
                                                    <h4>Assigned Deliverables & Contracts ({cWorks.length})</h4>
                                                    <button 
                                                        className="btn-primary-sm"
                                                        onClick={() => openAddWorkForContractor(contractor.id)}
                                                    >
                                                        + Add Work
                                                    </button>
                                                </div>

                                                {cWorks.length === 0 ? (
                                                    <p style={{ color: '#64748B', fontSize: '0.86rem', fontStyle: 'italic' }}>
                                                        No work assignments found. Click "+ Add Work" to add one.
                                                    </p>
                                                ) : (
                                                    cWorks.map(w => (
                                                        <div key={w.id} className="ctr-work-item">
                                                            <div className="ctr-work-desc">
                                                                <h5>{w.work_description || 'Contract Assignment'}</h5>
                                                                <p>
                                                                    Type: <strong>{w.work_type}</strong> | {w.start_date || 'No Start Date'} to {w.end_date || 'No End Date'}
                                                                </p>
                                                            </div>
                                                            <div className="ctr-work-meta">
                                                                <span className="ctr-work-price">
                                                                    ₹{parseFloat(w.total_payment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                    <span className={`status-pill ${w.work_status}`}>
                                                                        {w.work_status}
                                                                    </span>
                                                                    <Link to={`/contractors/work/${w.id}`} className="btn-action-sm">
                                                                        Timeline →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Button (FAB) */}
            <div className="fab-container">
                {fabOpen && (
                    <div className="fab-menu">
                        <button 
                            className="fab-item-btn"
                            onClick={() => { setFabOpen(false); setModalError(null); setActiveModal('ADD_CONTRACTOR'); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            Add Contractor Profile
                        </button>

                        <button 
                            className="fab-item-btn"
                            onClick={() => { setFabOpen(false); setModalError(null); setActiveModal('ADD_WORK'); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            Assign New Work
                        </button>

                        <button 
                            className="fab-item-btn"
                            onClick={() => { setFabOpen(false); setModalError(null); setActiveModal('ADD_PAYMENT'); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Record Payout / Payment
                        </button>
                    </div>
                )}

                <button 
                    className={`fab-main-btn ${fabOpen ? 'active' : ''}`}
                    onClick={() => setFabOpen(!fabOpen)}
                    aria-label="Action Menu"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>

            {/* MODAL: ADD CONTRACTOR */}
            {activeModal === 'ADD_CONTRACTOR' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Contractor</h3>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddContractorSubmit}>
                            <div className="modal-body">
                                {modalError && <div style={{ color: '#DC2626', marginBottom: '1rem', fontSize: '0.85rem' }}>{modalError}</div>}
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input type="text" className="form-control" required value={contractorForm.first_name} onChange={e => setContractorForm({...contractorForm, first_name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" className="form-control" value={contractorForm.last_name} onChange={e => setContractorForm({...contractorForm, last_name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input type="email" className="form-control" required value={contractorForm.email} onChange={e => setContractorForm({...contractorForm, email: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" className="form-control" value={contractorForm.phone_number} onChange={e => setContractorForm({...contractorForm, phone_number: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input type="text" className="form-control" value={contractorForm.company_name} onChange={e => setContractorForm({...contractorForm, company_name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Work Type</label>
                                        <select className="form-control" value={contractorForm.work_type} onChange={e => setContractorForm({...contractorForm, work_type: e.target.value})}>
                                            {WORK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>PAN Number</label>
                                        <input type="text" className="form-control" value={contractorForm.pan_number} onChange={e => setContractorForm({...contractorForm, pan_number: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>TAN Number</label>
                                        <input type="text" className="form-control" value={contractorForm.tan_number} onChange={e => setContractorForm({...contractorForm, tan_number: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Bank Account Number</label>
                                        <input type="text" className="form-control" value={contractorForm.bank_account_number} onChange={e => setContractorForm({...contractorForm, bank_account_number: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>IFSC Code</label>
                                        <input type="text" className="form-control" value={contractorForm.ifsc_code} onChange={e => setContractorForm({...contractorForm, ifsc_code: e.target.value})} />
                                    </div>
                                    <div className="form-group full">
                                        <label>UPI ID</label>
                                        <input type="text" className="form-control" value={contractorForm.upi_id} onChange={e => setContractorForm({...contractorForm, upi_id: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={submitting}>Save Contractor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD WORK */}
            {activeModal === 'ADD_WORK' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assign New Work</h3>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddWorkSubmit}>
                            <div className="modal-body">
                                {modalError && <div style={{ color: '#DC2626', marginBottom: '1rem', fontSize: '0.85rem' }}>{modalError}</div>}
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Select Contractor *</label>
                                        <select className="form-control" required value={workForm.contractor} onChange={e => setWorkForm({...workForm, contractor: e.target.value})}>
                                            <option value="">-- Choose Contractor --</option>
                                            {contractors.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.first_name} {c.last_name} ({c.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group full">
                                        <label>Work Description *</label>
                                        <input type="text" className="form-control" required placeholder="e.g. Frontend UI Development & Design" value={workForm.work_description} onChange={e => setWorkForm({...workForm, work_description: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Work Type</label>
                                        <select className="form-control" value={workForm.work_type} onChange={e => setWorkForm({...workForm, work_type: e.target.value})}>
                                            {WORK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select className="form-control" value={workForm.work_status} onChange={e => setWorkForm({...workForm, work_status: e.target.value})}>
                                            {WORK_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" value={workForm.start_date} onChange={e => setWorkForm({...workForm, start_date: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" value={workForm.end_date} onChange={e => setWorkForm({...workForm, end_date: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Rate (₹)</label>
                                        <input type="number" step="0.01" className="form-control" value={workForm.rate} onChange={e => setWorkForm({...workForm, rate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Units / Hours Worked</label>
                                        <input type="number" step="0.01" className="form-control" value={workForm.units_worked} onChange={e => setWorkForm({...workForm, units_worked: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Misc Charges (₹)</label>
                                        <input type="number" step="0.01" className="form-control" value={workForm.misc_charges} onChange={e => setWorkForm({...workForm, misc_charges: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>TDS Deduction (%)</label>
                                        <input type="number" step="0.01" className="form-control" value={workForm.tds_percentage} onChange={e => setWorkForm({...workForm, tds_percentage: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={submitting}>Create Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD PAYMENT */}
            {activeModal === 'ADD_PAYMENT' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Record Contractor Payout</h3>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddPaymentSubmit}>
                            <div className="modal-body">
                                {modalError && <div style={{ color: '#DC2626', marginBottom: '1rem', fontSize: '0.85rem' }}>{modalError}</div>}
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Select Contractor *</label>
                                        <select 
                                            className="form-control" 
                                            required 
                                            value={paymentForm.contractor} 
                                            onChange={e => setPaymentForm({...paymentForm, contractor: e.target.value, work: ''})}
                                        >
                                            <option value="">-- Choose Contractor --</option>
                                            {contractors.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.first_name} {c.last_name} ({c.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group full">
                                        <label>Link Work Assignment *</label>
                                        <select 
                                            className="form-control" 
                                            required 
                                            disabled={!paymentForm.contractor}
                                            value={paymentForm.work} 
                                            onChange={e => setPaymentForm({...paymentForm, work: e.target.value})}
                                        >
                                            <option value="">-- Select Work Item --</option>
                                            {getContractorWorks(parseInt(paymentForm.contractor)).map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.work_description} (Total Net: ₹{w.total_payment})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Amount (₹) *</label>
                                        <input type="number" step="0.01" className="form-control" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Date *</label>
                                        <input type="date" className="form-control" required value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Method</label>
                                        <select className="form-control" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                                            {PAYMENT_METHOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Status</label>
                                        <select className="form-control" value={paymentForm.payment_status} onChange={e => setPaymentForm({...paymentForm, payment_status: e.target.value})}>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={submitting}>Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contractors;
