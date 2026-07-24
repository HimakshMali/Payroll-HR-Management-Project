import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import '../style/employeefinance.css';

const CATEGORY_MAP = {
    'TRAVEL': 'Travel & Fuel Allowance',
    'FOOD': 'Food & Meals',
    'MEDICAL': 'Medical & Healthcare',
    'EQUIPMENT': 'Hardware & Equipment Procurement',
    'SOFTWARE': 'Software & SaaS Subscriptions',
    'RENT': 'Office Space & Storage Rent',
    'UTILITIES': 'Electricity & Water Utilities',
    'COMMUNICATION': 'Phone & Internet Allowance',
    'OFFICE_SUPPLIES': 'Office Stationery & Supplies',
    'LOGISTICS': 'Courier, Shipping & Delivery Costs',
    'MAINTENANCE': 'Office Repair & Maintenance',
    'CLIENT_MEETING': 'Client Entertainment & Hospitality',
    'MARKETING': 'Local Marketing & Business Ads',
    'TEAM_WELFARE': 'Team Celebrations & Snacks',
    'TRAINING': 'Courses, Books & Employee Training',
    'BONUS': 'Performance Bonus',
    'FESTIVAL_GIFT': 'Festival Incentive Token',
    'OTHER': 'Other Out-of-Pocket Expenses'
};

const ADVANCE_STATUS_MAP = {
    'PENDING': 'Pending Approval',
    'APPROVED': 'Approved',
    'PAID': 'Disbursed',
    'REJECTED': 'Rejected',
    'DEDUCTED': 'Fully Recovered'
};

const REIMBURSEMENT_STATUS_MAP = {
    'PENDING': 'Pending Review',
    'APPROVED': 'Approved',
    'PAID_WITH_PAYROLL': 'Settled in Payroll',
    'PAID_DIRECT': 'Paid Direct',
    'REJECTED': 'Rejected'
};

const EmployeeFinance = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile, employeeProfile } = useContext(AuthContext);

    const isManager = userProfile?.role === 'OWNER' || userProfile?.isHr;

    useEffect(() => {
        if (userProfile && !isManager) {
            if (employeeProfile && String(id) !== String(employeeProfile.id)) {
                console.warn("Unauthorized access attempt to employee finance ID:", id);
                navigate('/profile');
            }
        }
    }, [userProfile, employeeProfile, isManager, id, navigate]);

    // States for core data
    const [employee, setEmployee] = useState(null);
    const [salaryDetails, setSalaryDetails] = useState(null);
    const [advances, setAdvances] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    
    // Page load states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Speed Dial FAB state
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

    // Drawer & editing state: null, 'advance', or 'reimbursement'
    const [drawerType, setDrawerType] = useState(null);
    const [editingItem, setEditingItem] = useState(null); // { type: 'advance'|'reimbursement', id: number }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Forms states
    const [advanceForm, setAdvanceForm] = useState({
        amount: '',
        reason: '',
        status: 'PENDING',
        disbursement_date: '',
        recovery_month: ''
    });

    const [reimbursementForm, setReimbursementForm] = useState({
        category: 'OTHER',
        amount: '',
        reason: '',
        status: 'PENDING',
        is_processed_in_salary: false,
        payment_date: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch target employee details
            const empRes = await axiosInstance.get(`/employees/${id}/`);
            setEmployee(empRes.data);

            // 2. Fetch salary profile
            const salaryRes = await axiosInstance.get(`../payroll/salary-components/?employee=${id}`);
            if (salaryRes.data && salaryRes.data.length > 0) {
                setSalaryDetails(salaryRes.data[0]);
            } else {
                setSalaryDetails(null);
            }

            // 3. Fetch advance payments
            const advancesRes = await axiosInstance.get(`../payroll/advances/?employee=${id}`);
            setAdvances(advancesRes.data);

            // 4. Fetch reimbursements
            const reimbursementsRes = await axiosInstance.get(`../payroll/reimbursements/?employee=${id}`);
            setReimbursements(reimbursementsRes.data);

            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to fetch financial details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleOpenDrawer = (type) => {
        if (type === 'advance' && !isManager) {
            alert("Unauthorized action.");
            return;
        }
        setEditingItem(null);
        setDrawerType(type);
        setIsSpeedDialOpen(false);
        setFormErrors({});
        
        // Reset forms
        setAdvanceForm({
            amount: '',
            reason: '',
            status: 'PENDING',
            disbursement_date: '',
            recovery_month: ''
        });
        setReimbursementForm({
            category: 'OTHER',
            amount: '',
            reason: '',
            status: 'PENDING',
            is_processed_in_salary: false,
            payment_date: ''
        });
    };

    const handleEditOpen = (type, item) => {
        if (!isManager) {
            alert("Only managers can configure records.");
            return;
        }
        setEditingItem({ type, id: item.id });
        setFormErrors({});
        if (type === 'advance') {
            setAdvanceForm({
                amount: item.amount || '',
                reason: item.reason || '',
                status: item.status || 'PENDING',
                disbursement_date: item.disbursement_date || '',
                recovery_month: item.recovery_month || ''
            });
            setDrawerType('advance');
        } else if (type === 'reimbursement') {
            setReimbursementForm({
                category: item.category || 'OTHER',
                amount: item.amount || '',
                reason: item.reason || '',
                status: item.status || 'PENDING',
                is_processed_in_salary: Boolean(item.is_processed_in_salary),
                payment_date: item.payment_date || ''
            });
            setDrawerType('reimbursement');
        }
    };

    const handleCloseDrawer = () => {
        setDrawerType(null);
        setEditingItem(null);
        setFormErrors({});
    };

    const handleQuickStatusUpdate = async (type, itemId, newStatus) => {
        if (!isManager) return;
        try {
            const endpoint = type === 'advance' 
                ? `../payroll/advances/${itemId}/` 
                : `../payroll/reimbursements/${itemId}/`;
            await axiosInstance.patch(endpoint, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error(`Error updating ${type} status:`, err);
            alert(err.response?.data?.detail || err.response?.data?.error || `Failed to update ${type} status.`);
        }
    };

    const handleDeleteItem = async (type, itemId) => {
        if (!isManager) return;
        if (!window.confirm(`Are you sure you want to delete this ${type} record?`)) return;
        try {
            const endpoint = type === 'advance' 
                ? `../payroll/advances/${itemId}/` 
                : `../payroll/reimbursements/${itemId}/`;
            await axiosInstance.delete(endpoint);
            fetchData();
        } catch (err) {
            console.error(`Error deleting ${type}:`, err);
            alert(err.response?.data?.detail || `Failed to delete ${type}.`);
        }
    };

    const handleAdvanceSubmit = async (e) => {
        e.preventDefault();
        if (!isManager) {
            alert("Unauthorized action.");
            return;
        }
        setIsSubmitting(true);
        setFormErrors({});

        const payload = {
            employee: parseInt(id),
            amount: parseFloat(advanceForm.amount),
            reason: advanceForm.reason || null,
            status: advanceForm.status,
            disbursement_date: advanceForm.disbursement_date || null,
            recovery_month: advanceForm.recovery_month || null
        };

        try {
            if (editingItem && editingItem.type === 'advance') {
                await axiosInstance.patch(`../payroll/advances/${editingItem.id}/`, payload);
            } else {
                await axiosInstance.post('../payroll/advances/', payload);
            }
            handleCloseDrawer();
            fetchData();
        } catch (err) {
            console.error(err);
            setFormErrors(err.response?.data || { detail: 'An error occurred while saving the advance request.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReimbursementSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const payload = {
            employee: parseInt(id),
            category: reimbursementForm.category,
            amount: parseFloat(reimbursementForm.amount),
            reason: reimbursementForm.reason || null,
            status: reimbursementForm.status,
            is_processed_in_salary: reimbursementForm.status === 'PAID_WITH_PAYROLL' ? true : Boolean(reimbursementForm.is_processed_in_salary && reimbursementForm.status !== 'APPROVED'),
            payment_date: reimbursementForm.payment_date || null
        };

        try {
            if (editingItem && editingItem.type === 'reimbursement') {
                await axiosInstance.patch(`../payroll/reimbursements/${editingItem.id}/`, payload);
            } else {
                await axiosInstance.post('../payroll/reimbursements/', payload);
            }
            handleCloseDrawer();
            fetchData();
        } catch (err) {
            console.error(err);
            setFormErrors(err.response?.data || { detail: 'An error occurred while submitting the reimbursement.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Keyboard handlers (Esc key closes drawer)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCloseDrawer();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return (
            <div className="finance-loading-zone">
                <div className="finance-pulse-loader"></div>
                <p>Loading financial directories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="finance-error-zone">
                <div className="finance-error-card">
                    <h3>⚠️ Error Loading Data</h3>
                    <p>{error}</p>
                    <button onClick={fetchData} className="btn-retry">Try Again</button>
                    <Link to={isManager ? "/employees" : "/profile"} className="btn-back-link">{isManager ? "Back to Directory" : "Back to Profile"}</Link>
                </div>
            </div>
        );
    }

    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${id}`;

    return (
        <div className="finance-dashboard">
            {/* Header Section */}
            <div className="finance-header">
                <div className="header-left">
                    <button onClick={() => navigate(isManager ? '/employees' : '/profile')} className="btn-back-arrow" title={isManager ? "Back to directory" : "Back to Profile"}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <div className="header-emp-avatar">
                        <img src={avatarUrl} alt="Employee Avatar" />
                    </div>
                    <div className="header-emp-info">
                        <div style={{ marginBottom: '4px' }}>
                            <span className="landing-pill-tag"><span className="tag-dot"></span> FINANCIAL DIRECTORY</span>
                        </div>
                        <h2>{employee ? `${employee.first_name || ''} ${employee.last_name || ''}` : 'Employee Finance'}</h2>
                        <div className="info-meta">
                            <span>{employee?.user?.email}</span>
                            <span className="dot">•</span>
                            <span className="role-tag">{employee?.role || 'EMPLOYEE'}</span>
                        </div>
                    </div>
                </div>

                <div className="header-right-stats">
                    <Link to={`/employees/${id}/payroll`} className="btn-action-payroll">
                        ⚡ Monthly Payroll Manager
                    </Link>
                    <div className="stat-capsule landing-stat">
                        <span className="lbl">Net Take-Home</span>
                        <span className="val highlight-green">
                            {salaryDetails?.net_salary ? `₹${Number(salaryDetails.net_salary).toLocaleString('en-IN')}` : '₹0.00'}
                        </span>
                    </div>
                    <div className="stat-capsule landing-stat">
                        <span className="lbl">Cost To Company</span>
                        <span className="val highlight-forest">
                            {salaryDetails?.cost_to_company ? `₹${Number(salaryDetails.cost_to_company).toLocaleString('en-IN')}` : '₹0.00'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="finance-grid">
                
                {/* Left/Top: Salary Structure breakdown */}
                <div className="finance-card salary-breakdown-card">
                    <div className="card-header-with-icon">
                        <div className="title-section">
                            <svg className="icon-header" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                <line x1="12" y1="4" x2="12" y2="20"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                            </svg>
                            <h3>Salary Profile Details</h3>
                        </div>
                        <span className="badge-compliance">
                            {salaryDetails?.passes_wage_code_compliance ? '✅ Compliant' : '⚠️ Wage Compliance Pending'}
                        </span>
                    </div>

                    <div className="salary-tables-container">
                        {/* Earnings Table */}
                        <div className="salary-block allowances-block">
                            <h4 className="block-title font-allowance">Allowances & Earnings</h4>
                            <div className="salary-rows">
                                <div className="salary-row">
                                    <span className="row-label font-bold">Basic Pay</span>
                                    <span className="row-value font-bold">₹{Number(salaryDetails?.basic_salary || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Special Allowance</span>
                                    <span className="row-value">₹{Number(salaryDetails?.special_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">House Rent Allowance (HRA)</span>
                                    <span className="row-value">₹{Number(salaryDetails?.house_rent_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Conveyance Allowance</span>
                                    <span className="row-value">₹{Number(salaryDetails?.conveyance_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Phone Allowance</span>
                                    <span className="row-value">₹{Number(salaryDetails?.phone_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Medical Allowance</span>
                                    <span className="row-value">₹{Number(salaryDetails?.medical_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row total-row">
                                    <span className="row-label">Total Allowances</span>
                                    <span className="row-value">₹{Number(salaryDetails?.total_allowence || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row gross-row">
                                    <span className="row-label">Gross Salary</span>
                                    <span className="row-value">₹{Number(salaryDetails?.gross_salary || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions Table */}
                        <div className="salary-block deductions-block">
                            <h4 className="block-title font-deduction">Deductions & Contributions</h4>
                            <div className="salary-rows">
                                <div className="salary-row">
                                    <span className="row-label">EPF Deduction</span>
                                    <span className="row-value">₹{Number(salaryDetails?.deductions_EPF || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">ESI Deduction</span>
                                    <span className="row-value">₹{Number(salaryDetails?.deductions_ESI || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">TDS (Tax) Deduction</span>
                                    <span className="row-value">₹{Number(salaryDetails?.deductions_TDS || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Professional Tax</span>
                                    <span className="row-value">₹{Number(salaryDetails?.deductions_professional_tax || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span className="row-label">Other Deductions</span>
                                    <span className="row-value">₹{Number(salaryDetails?.deductions_other || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row ep-contrib-row">
                                    <span className="row-label">Employer EPF Contribution</span>
                                    <span className="row-value">₹{Number(salaryDetails?.employer_epf || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row ep-contrib-row">
                                    <span className="row-label">Employer ESI Contribution</span>
                                    <span className="row-value">₹{Number(salaryDetails?.employer_esi || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row total-row deduction-total">
                                    <span className="row-label">Total Deductions</span>
                                    <span className="row-value">₹{Number(salaryDetails?.total_deductions || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-grid for Lists (Reimbursement & Advances) */}
                <div className="lists-grid-row">
                    
                    {/* Advance Payments List */}
                    <div className="finance-card list-card">
                        <div className="list-card-header">
                            <div className="title-left">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <line x1="6" y1="12" x2="6.01" y2="12"></line>
                                    <line x1="18" y1="12" x2="18.01" y2="12"></line>
                                </svg>
                                <h3>Advance Payments</h3>
                            </div>
                            <span className="counter-badge">{advances.length} Items</span>
                        </div>

                        <div className="list-content-scrollable">
                            {advances.length === 0 ? (
                                <div className="empty-list-state">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <p>No advance payments recorded.</p>
                                    {isManager && <button onClick={() => handleOpenDrawer('advance')} className="btn-inline-add">Request Advance</button>}
                                </div>
                            ) : (
                                <div className="records-list">
                                    {advances.map((item) => (
                                        <div key={item.id} className="record-item">
                                            <div className="record-primary">
                                                <div className="record-main-info">
                                                    <span className="rec-amount">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                                                    <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                                                        {ADVANCE_STATUS_MAP[item.status] || item.status}
                                                    </span>
                                                </div>
                                                <span className="rec-reason">{item.reason || 'No reason specified'}</span>
                                            </div>
                                            <div className="record-meta-dates">
                                                {item.disbursement_date && (
                                                    <div className="meta-date">
                                                        <span className="lbl">Disbursed:</span>
                                                        <span className="val">{item.disbursement_date}</span>
                                                    </div>
                                                )}
                                                {item.recovery_month && (
                                                    <div className="meta-date">
                                                        <span className="lbl">Recovery Cycle:</span>
                                                        <span className="val">{item.recovery_month}</span>
                                                    </div>
                                                )}
                                                <div className="meta-date">
                                                    <span className="lbl">Recorded:</span>
                                                    <span className="val">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {isManager && (
                                                <div className="record-actions-bar">
                                                    {item.status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                className="btn-action-sm btn-approve"
                                                                onClick={() => handleQuickStatusUpdate('advance', item.id, 'APPROVED')}
                                                                title="Approve Advance"
                                                            >
                                                                ✓ Approve
                                                            </button>
                                                            <button 
                                                                className="btn-action-sm btn-reject"
                                                                onClick={() => handleQuickStatusUpdate('advance', item.id, 'REJECTED')}
                                                                title="Reject Advance"
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        className="btn-action-sm btn-config"
                                                        onClick={() => handleEditOpen('advance', item)}
                                                        title="Configure / Edit"
                                                    >
                                                        ⚙ Configure
                                                    </button>
                                                    <button 
                                                        className="btn-action-sm btn-delete"
                                                        onClick={() => handleDeleteItem('advance', item.id)}
                                                        title="Delete Record"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reimbursements List */}
                    <div className="finance-card list-card">
                        <div className="list-card-header">
                            <div className="title-left">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <h3>Reimbursement Claims</h3>
                            </div>
                            <span className="counter-badge">{reimbursements.length} Claims</span>
                        </div>

                        <div className="list-content-scrollable">
                            {reimbursements.length === 0 ? (
                                <div className="empty-list-state">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                        <polyline points="13 2 13 9 20 9"></polyline>
                                    </svg>
                                    <p>No reimbursement claims filed.</p>
                                    <button onClick={() => handleOpenDrawer('reimbursement')} className="btn-inline-add">File a Claim</button>
                                </div>
                            ) : (
                                <div className="records-list">
                                    {reimbursements.map((item) => (
                                        <div key={item.id} className="record-item">
                                            <div className="record-primary">
                                                <div className="record-main-info">
                                                    <span className="rec-amount">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                                                    <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                                                        {REIMBURSEMENT_STATUS_MAP[item.status] || item.status}
                                                    </span>
                                                </div>
                                                <span className="rec-category">{CATEGORY_MAP[item.category] || item.category}</span>
                                                <span className="rec-reason">{item.reason || 'No description provided'}</span>
                                            </div>
                                            <div className="record-meta-dates">
                                                {item.payment_date && (
                                                    <div className="meta-date">
                                                        <span className="lbl">Settled Date:</span>
                                                        <span className="val">{item.payment_date}</span>
                                                    </div>
                                                )}
                                                <div className="meta-date">
                                                    <span className="lbl">Processed in Salary:</span>
                                                    <span className="val">{item.is_processed_in_salary ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div className="meta-date">
                                                    <span className="lbl">Submitted:</span>
                                                    <span className="val">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {isManager && (
                                                <div className="record-actions-bar">
                                                    {item.status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                className="btn-action-sm btn-approve"
                                                                onClick={() => handleQuickStatusUpdate('reimbursement', item.id, 'APPROVED')}
                                                                title="Approve Claim"
                                                            >
                                                                ✓ Approve
                                                            </button>
                                                            <button 
                                                                className="btn-action-sm btn-reject"
                                                                onClick={() => handleQuickStatusUpdate('reimbursement', item.id, 'REJECTED')}
                                                                title="Reject Claim"
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        className="btn-action-sm btn-config"
                                                        onClick={() => handleEditOpen('reimbursement', item)}
                                                        title="Configure / Edit"
                                                    >
                                                        ⚙ Configure
                                                    </button>
                                                    <button 
                                                        className="btn-action-sm btn-delete"
                                                        onClick={() => handleDeleteItem('reimbursement', item.id)}
                                                        title="Delete Claim"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Speed Dial FAB */}
            <div className={`speed-dial-container ${isSpeedDialOpen ? 'open' : ''}`}>
                <div className="speed-dial-actions">
                    {/* Expand option 1: Reimbursement */}
                    <button 
                        onClick={() => handleOpenDrawer('reimbursement')} 
                        className="speed-dial-btn secondary-fab fab-reimb"
                        title="Add Reimbursement Claim"
                    >
                        <span className="fab-tooltip">Claim Reimbursement</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </button>

                    {/* Expand option 2: Advance (Only for Managers) */}
                    {isManager && (
                        <button 
                            onClick={() => handleOpenDrawer('advance')} 
                            className="speed-dial-btn secondary-fab fab-adv"
                            title="Add Advance Payment"
                        >
                            <span className="fab-tooltip">Record Advance</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </button>
                    )}
                </div>

                <button 
                    onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)} 
                    className="speed-dial-btn main-fab"
                    title="Add Entry"
                >
                    <svg className="icon-plus" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            {/* Slide-over Side Drawer Panel */}
            {drawerType && (
                <>
                    <div className="drawer-overlay" onClick={handleCloseDrawer}></div>
                    <div className="drawer-panel">
                        <div className="drawer-header">
                            <div className="drawer-title-group">
                                <h3>{drawerType === 'advance' ? 'Record Advance Payment' : 'New Reimbursement Claim'}</h3>
                                <p className="drawer-subtitle">For {employee ? `${employee.first_name || ''} ${employee.last_name || ''}` : 'Employee'}</p>
                            </div>
                            <button onClick={handleCloseDrawer} className="btn-close-drawer">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="drawer-body">
                            {formErrors.detail && (
                                <div className="alert-banner error-banner">
                                    <span>⚠️</span>
                                    <p>{formErrors.detail}</p>
                                </div>
                            )}

                            {drawerType === 'advance' && (
                                <form onSubmit={handleAdvanceSubmit} className="drawer-form">
                                    {/* Employee Name (Read Only) */}
                                    <div className="form-group">
                                        <label className="field-lbl">Target Employee</label>
                                        <input 
                                            type="text" 
                                            className="input-field read-only" 
                                            value={employee ? `${employee.first_name || ''} ${employee.last_name || ''} (${employee?.user?.email || ''})` : ''} 
                                            disabled 
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className={`form-group ${formErrors.amount ? 'has-error' : ''}`}>
                                        <label className="field-lbl required">Advance Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            className="input-field" 
                                            placeholder="Enter amount"
                                            value={advanceForm.amount}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                                            required 
                                            min="0"
                                            step="0.01"
                                        />
                                        {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
                                    </div>

                                    {/* Reason */}
                                    <div className={`form-group ${formErrors.reason ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Reason / Purpose</label>
                                        <textarea 
                                            className="textarea-field" 
                                            placeholder="Describe the reason for this advance"
                                            value={advanceForm.reason}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                                            rows="3"
                                        />
                                        {formErrors.reason && <span className="error-message">{formErrors.reason}</span>}
                                    </div>

                                    {/* Status (Only editable if OWNER/HR) */}
                                    <div className={`form-group ${formErrors.status ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Status</label>
                                        <select 
                                            className="select-field" 
                                            value={advanceForm.status}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, status: e.target.value })}
                                        >
                                            <option value="PENDING">Pending Approval</option>
                                            <option value="APPROVED">Approved (Awaiting Payout)</option>
                                            <option value="PAID">Disbursed to Employee</option>
                                            <option value="REJECTED">Rejected</option>
                                            <option value="DEDUCTED">Fully Recovered from Salary</option>
                                        </select>
                                        {formErrors.status && <span className="error-message">{formErrors.status}</span>}
                                    </div>

                                    {/* Disbursement Date */}
                                    <div className={`form-group ${formErrors.disbursement_date ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Disbursement Date</label>
                                        <input 
                                            type="date" 
                                            className="input-field" 
                                            value={advanceForm.disbursement_date}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, disbursement_date: e.target.value })}
                                        />
                                        {formErrors.disbursement_date && <span className="error-message">{formErrors.disbursement_date}</span>}
                                    </div>

                                    {/* Recovery Month */}
                                    <div className={`form-group ${formErrors.recovery_month ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Recovery Target Month</label>
                                        <input 
                                            type="date" 
                                            className="input-field" 
                                            value={advanceForm.recovery_month}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, recovery_month: e.target.value })}
                                            help-text="The salary cycle month this should be deducted from"
                                        />
                                        <small className="help-text">The month's salary cycle this deduction should apply to (e.g. 2026-08-01).</small>
                                        {formErrors.recovery_month && <span className="error-message">{formErrors.recovery_month}</span>}
                                    </div>

                                    <div className="drawer-footer">
                                        <button type="button" onClick={handleCloseDrawer} className="btn-sec">Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-pri">
                                            {isSubmitting ? 'Recording...' : 'Record Advance'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {drawerType === 'reimbursement' && (
                                <form onSubmit={handleReimbursementSubmit} className="drawer-form">
                                    {/* Employee Name (Read Only) */}
                                    <div className="form-group">
                                        <label className="field-lbl">Claiming Employee</label>
                                        <input 
                                            type="text" 
                                            className="input-field read-only" 
                                            value={employee ? `${employee.first_name || ''} ${employee.last_name || ''} (${employee?.user?.email || ''})` : ''} 
                                            disabled 
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className={`form-group ${formErrors.category ? 'has-error' : ''}`}>
                                        <label className="field-lbl required">Expense Category</label>
                                        <select 
                                            className="select-field"
                                            value={reimbursementForm.category}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, category: e.target.value })}
                                            required
                                        >
                                            {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                        {formErrors.category && <span className="error-message">{formErrors.category}</span>}
                                    </div>

                                    {/* Amount */}
                                    <div className={`form-group ${formErrors.amount ? 'has-error' : ''}`}>
                                        <label className="field-lbl required">Claim Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            className="input-field" 
                                            placeholder="Enter expense amount"
                                            value={reimbursementForm.amount}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })}
                                            required 
                                            min="0"
                                            step="0.01"
                                        />
                                        {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
                                    </div>

                                    {/* Reason */}
                                    <div className={`form-group ${formErrors.reason ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Reason / Descriptions</label>
                                        <textarea 
                                            className="textarea-field" 
                                            placeholder="Describe the claim or outline items purchased"
                                            value={reimbursementForm.reason}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, reason: e.target.value })}
                                            rows="3"
                                        />
                                        {formErrors.reason && <span className="error-message">{formErrors.reason}</span>}
                                    </div>

                                    {/* Status (Only editable if OWNER/HR) */}
                                    <div className={`form-group ${formErrors.status ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Status</label>
                                        <select 
                                            className="select-field" 
                                            value={reimbursementForm.status}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, status: e.target.value })}
                                            disabled={!isManager}
                                        >
                                            <option value="PENDING">Pending Review</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="PAID_WITH_PAYROLL">Settled via Monthly Salary Payout</option>
                                            <option value="PAID_DIRECT">Paid Out Cache/Direct Transfer</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                        {!isManager && <small className="help-text">Standard employees submit claims as Pending review.</small>}
                                        {formErrors.status && <span className="error-message">{formErrors.status}</span>}
                                    </div>

                                    {/* Payment Date */}
                                    <div className={`form-group ${formErrors.payment_date ? 'has-error' : ''}`}>
                                        <label className="field-lbl">Payment Date</label>
                                        <input 
                                            type="date" 
                                            className="input-field" 
                                            value={reimbursementForm.payment_date}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, payment_date: e.target.value })}
                                            disabled={!isManager}
                                        />
                                        {formErrors.payment_date && <span className="error-message">{formErrors.payment_date}</span>}
                                    </div>

                                    {/* Is Processed in Salary */}
                                    <div className="form-group checkbox-group">
                                        <input 
                                            type="checkbox" 
                                            id="is_processed_in_salary"
                                            className="checkbox-input" 
                                            checked={reimbursementForm.is_processed_in_salary}
                                            onChange={(e) => setReimbursementForm({ ...reimbursementForm, is_processed_in_salary: e.target.checked })}
                                            disabled={!isManager}
                                        />
                                        <label htmlFor="is_processed_in_salary" className="checkbox-lbl">
                                            Processed in Salary
                                            <span className="subtext">Has the payroll run already settled this claim?</span>
                                        </label>
                                    </div>

                                    <div className="drawer-footer">
                                        <button type="button" onClick={handleCloseDrawer} className="btn-sec">Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-pri">
                                            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeFinance;