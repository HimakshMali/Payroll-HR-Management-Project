import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import '../style/monthlysalary.css';

const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const PAYMENT_TYPES = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CASH', label: 'Cash' },
    { value: 'CHEQUE', label: 'Cheque' },
];

const STATUS_CHOICES = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'GENERATED', label: 'Generated' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const MonthlySalary = () => {
    const { id: paramEmployeeId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useContext(AuthContext);

    const isOverviewMode = !paramEmployeeId;

    // Filter states
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(paramEmployeeId || '');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Overview specific state
    const [allSalaryRecords, setAllSalaryRecords] = useState([]);
    const [allSalaryComponents, setAllSalaryComponents] = useState([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Single Record Detail State
    const [salaryRecord, setSalaryRecord] = useState(null);
    const [recordId, setRecordId] = useState(null);
    const [linkedReimbursements, setLinkedReimbursements] = useState([]);
    const [linkedAdvances, setLinkedAdvances] = useState([]);

    // Form editable state (Detail View)
    const [formData, setFormData] = useState({
        basic_salary: '0.00',
        house_rent_allowence: '0.00',
        conveyance_allowence: '0.00',
        phone_allowence: '0.00',
        medical_allowence: '0.00',
        special_allowence: '0.00',
        
        deductions_EPF: '0.00',
        deductions_ESI: '0.00',
        deductions_TDS: '0.00',
        deductions_professional_tax: '0.00',
        deductions_other: '0.00',
        
        lop_days: '0',
        lop_deductions: '0.00',
        approved_reimbursements: '0.00',
        advances_deducted: '0.00',

        employer_epf: '0.00',
        employer_esi: '0.00',

        status: 'DRAFT',
        payment_type: 'BANK_TRANSFER',
        payment_date: ''
    });

    const [loadingDetail, setLoadingDetail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingPaid, setIsProcessingPaid] = useState(false);
    const [message, setMessage] = useState(null);

    // Synchronize param switch
    useEffect(() => {
        if (paramEmployeeId) {
            setSelectedEmployeeId(paramEmployeeId);
        }
    }, [paramEmployeeId]);

    // =========================================================================
    // OVERVIEW DATA FETCHING (When no specific employee ID param in URL)
    // =========================================================================
    useEffect(() => {
        if (!isOverviewMode) return;

        const fetchOverviewData = async () => {
            try {
                setLoadingOverview(true);
                const [empRes, recordsRes, compRes] = await Promise.all([
                    axiosInstance.get('/employees/'),
                    axiosInstance.get('../payroll/salary-records/'),
                    axiosInstance.get('../payroll/salary-components/')
                ]);

                setEmployees(empRes.data || []);
                setAllSalaryRecords(recordsRes.data || []);
                setAllSalaryComponents(compRes.data || []);
            } catch (err) {
                console.error("Failed to fetch overview payroll data:", err);
            } finally {
                setLoadingOverview(false);
            }
        };

        fetchOverviewData();
    }, [isOverviewMode, selectedMonth, selectedYear]);

    // =========================================================================
    // SINGLE EMPLOYEE DETAIL DATA FETCHING
    // =========================================================================
    const fetchSinglePayrollRecord = async () => {
        if (!selectedEmployeeId || isOverviewMode) return;
        try {
            setLoadingDetail(true);
            setMessage(null);

            // Fetch records from backend
            const recordsRes = await axiosInstance.get(`../payroll/salary-records/?employee=${selectedEmployeeId}`);
            const allRecords = recordsRes.data || [];
            
            const matching = allRecords.find(
                r => (String(r.employee) === String(selectedEmployeeId) || String(r.employee?.id) === String(selectedEmployeeId)) &&
                     String(r.month) === String(selectedMonth) && 
                     String(r.year) === String(selectedYear)
            );

            // Fetch linked reimbursements & advances
            const [reimbRes, advRes] = await Promise.all([
                axiosInstance.get(`../payroll/reimbursements/?employee=${selectedEmployeeId}`),
                axiosInstance.get(`../payroll/advances/?employee=${selectedEmployeeId}`)
            ]);

            const reimbs = reimbRes.data || [];
            const advs = advRes.data || [];

            setLinkedReimbursements(reimbs);
            setLinkedAdvances(advs);

            const approvedReimbSum = reimbs
                .filter(r => r.status === 'APPROVED')
                .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

            const approvedAdvSum = advs
                .filter(a => a.status === 'APPROVED')
                .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

            if (matching) {
                setSalaryRecord(matching);
                setRecordId(matching.id);

                const existingReimbVal = parseFloat(matching.approved_reimbursements || 0);
                const existingAdvVal = parseFloat(matching.advances_deducted || 0);

                const isDraft = !matching.status || matching.status === 'DRAFT';
                const finalReimb = (isDraft && approvedReimbSum > 0)
                    ? Math.max(existingReimbVal, approvedReimbSum).toFixed(2)
                    : (existingReimbVal > 0 ? matching.approved_reimbursements : approvedReimbSum.toFixed(2));

                const finalAdv = (isDraft && approvedAdvSum > 0)
                    ? Math.max(existingAdvVal, approvedAdvSum).toFixed(2)
                    : (existingAdvVal > 0 ? matching.advances_deducted : approvedAdvSum.toFixed(2));

                setFormData({
                    basic_salary: matching.basic_salary || '0.00',
                    house_rent_allowence: matching.house_rent_allowence || '0.00',
                    conveyance_allowence: matching.conveyance_allowence || '0.00',
                    phone_allowence: matching.phone_allowence || '0.00',
                    medical_allowence: matching.medical_allowence || '0.00',
                    special_allowence: matching.special_allowence || '0.00',
                    
                    deductions_EPF: matching.deductions_EPF || '0.00',
                    deductions_ESI: matching.deductions_ESI || '0.00',
                    deductions_TDS: matching.deductions_TDS || '0.00',
                    deductions_professional_tax: matching.deductions_professional_tax || '0.00',
                    deductions_other: matching.deductions_other || '0.00',
                    
                    lop_days: matching.lop_days || '0',
                    lop_deductions: matching.lop_deductions || '0.00',
                    approved_reimbursements: finalReimb,
                    advances_deducted: finalAdv,

                    employer_epf: matching.employer_epf || '0.00',
                    employer_esi: matching.employer_esi || '0.00',

                    status: matching.status || 'DRAFT',
                    payment_type: matching.payment_type || 'BANK_TRANSFER',
                    payment_date: matching.payment_date || ''
                });
            } else {
                setSalaryRecord(null);
                setRecordId(null);

                // Fetch base components to pre-fill
                try {
                    const compRes = await axiosInstance.get(`../payroll/salary-components/?employee=${selectedEmployeeId}`);
                    const comp = compRes.data && compRes.data.length > 0 ? compRes.data[0] : null;
                    
                    setFormData({
                        basic_salary: comp?.basic_salary || '0.00',
                        house_rent_allowence: comp?.house_rent_allowence || '0.00',
                        conveyance_allowence: comp?.conveyance_allowence || '0.00',
                        phone_allowence: comp?.phone_allowence || '0.00',
                        medical_allowence: comp?.medical_allowence || '0.00',
                        special_allowence: comp?.special_allowence || '0.00',
                        
                        deductions_EPF: comp?.deductions_EPF || '0.00',
                        deductions_ESI: comp?.deductions_ESI || '0.00',
                        deductions_TDS: comp?.deductions_TDS || '0.00',
                        deductions_professional_tax: comp?.deductions_professional_tax || '0.00',
                        deductions_other: comp?.deductions_other || '0.00',
                        
                        lop_days: '0',
                        lop_deductions: '0.00',
                        approved_reimbursements: approvedReimbSum.toFixed(2),
                        advances_deducted: approvedAdvSum.toFixed(2),

                        employer_epf: comp?.employer_epf || '0.00',
                        employer_esi: comp?.employer_esi || '0.00',

                        status: 'DRAFT',
                        payment_type: 'BANK_TRANSFER',
                        payment_date: ''
                    });
                } catch (cErr) {
                    console.warn("Could not fetch base salary components:", cErr);
                }
            }
        } catch (err) {
            console.error("Error fetching single payroll record:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (!isOverviewMode && selectedEmployeeId) {
            fetchSinglePayrollRecord();
        }
    }, [isOverviewMode, selectedEmployeeId, selectedMonth, selectedYear]);

    // Format Currency Helper
    const formatINR = (val) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(num);
    };

    // Calculate Overview Metrics dynamically across all employees
    const overviewCalculations = React.useMemo(() => {
        let totalDispersable = 0;
        let totalCompliances = 0;
        let totalCTC = 0;

        let epfTotal = 0;
        let esiTotal = 0;
        let tdsTotal = 0;
        let ptTotal = 0;
        let otherTotal = 0;

        let counts = { DRAFT: 0, APPROVED: 0, PAID: 0, GENERATED: 0, CANCELLED: 0 };

        const mappedEmployees = employees.map(emp => {
            const empIdStr = String(emp.id);
            
            // Find salary record for chosen month & year
            const record = allSalaryRecords.find(r => 
                (String(r.employee) === empIdStr || String(r.employee?.id) === empIdStr) &&
                String(r.month) === String(selectedMonth) &&
                String(r.year) === String(selectedYear)
            );

            // Fallback to base components
            const comp = allSalaryComponents.find(c => 
                String(c.employee) === empIdStr || String(c.employee?.id) === empIdStr
            );

            const gross = record ? parseFloat(record.gross_salary || 0) : parseFloat(comp?.gross_salary || 0);
            const totalDeductions = record ? parseFloat(record.total_deductions || 0) : parseFloat(comp?.total_deductions || 0);
            const netTakeHome = record ? parseFloat(record.net_salary || 0) : parseFloat(comp?.net_salary || 0);
            const ctc = record ? parseFloat(record.cost_to_company || 0) : parseFloat(comp?.cost_to_company || 0);
            const status = record?.status || 'DRAFT';

            // Compliances calculation: EPF (employee+employer) + ESI (employee+employer) + TDS + PT + Other
            const eeEPF = record ? parseFloat(record.deductions_EPF || 0) : parseFloat(comp?.deductions_EPF || 0);
            const erEPF = record ? parseFloat(record.employer_epf || 0) : parseFloat(comp?.employer_epf || 0);
            
            const eeESI = record ? parseFloat(record.deductions_ESI || 0) : parseFloat(comp?.deductions_ESI || 0);
            const erESI = record ? parseFloat(record.employer_esi || 0) : parseFloat(comp?.employer_esi || 0);

            const tds = record ? parseFloat(record.deductions_TDS || 0) : parseFloat(comp?.deductions_TDS || 0);
            const pt = record ? parseFloat(record.deductions_professional_tax || 0) : parseFloat(comp?.deductions_professional_tax || 0);
            const other = record ? parseFloat(record.deductions_other || 0) : parseFloat(comp?.deductions_other || 0);

            const empCompliance = (eeEPF + erEPF) + (eeESI + erESI) + tds + pt + other;

            totalDispersable += netTakeHome;
            totalCompliances += empCompliance;
            totalCTC += ctc;

            epfTotal += (eeEPF + erEPF);
            esiTotal += (eeESI + erESI);
            tdsTotal += tds;
            ptTotal += pt;
            otherTotal += other;

            counts[status] = (counts[status] || 0) + 1;

            return {
                ...emp,
                record,
                comp,
                gross,
                totalDeductions,
                netTakeHome,
                ctc,
                status,
                empCompliance
            };
        });

        return {
            mappedEmployees,
            totalDispersable,
            totalCompliances,
            totalCTC,
            epfTotal,
            esiTotal,
            tdsTotal,
            ptTotal,
            otherTotal,
            counts
        };
    }, [employees, allSalaryRecords, allSalaryComponents, selectedMonth, selectedYear]);

    // Filter employees for Overview Table
    const filteredOverviewEmployees = React.useMemo(() => {
        return overviewCalculations.mappedEmployees.filter(emp => {
            const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
            const email = (emp.user?.email || '').toLowerCase();
            const role = (emp.role || '').toLowerCase();
            const query = searchQuery.toLowerCase();

            const matchesSearch = fullName.includes(query) || email.includes(query) || role.includes(query);
            const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [overviewCalculations.mappedEmployees, searchQuery, statusFilter]);

    // =========================================================================
    // DETAIL VIEW HANDLERS
    // =========================================================================
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSyncClaimsAndAdvances = () => {
        const approvedReimbSum = linkedReimbursements
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

        const approvedAdvSum = linkedAdvances
            .filter(a => a.status === 'APPROVED')
            .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

        setFormData(prev => ({
            ...prev,
            approved_reimbursements: approvedReimbSum.toFixed(2),
            advances_deducted: approvedAdvSum.toFixed(2)
        }));

        setMessage({
            type: 'success',
            text: `Synced! Applied +₹${approvedReimbSum.toFixed(2)} Reimbursements & -₹${approvedAdvSum.toFixed(2)} Advances into calculations.`
        });
    };

    // Live calculation of totals for Detail View
    const basic = parseFloat(formData.basic_salary || 0);
    const hra = parseFloat(formData.house_rent_allowence || 0);
    const conveyance = parseFloat(formData.conveyance_allowence || 0);
    const phone = parseFloat(formData.phone_allowence || 0);
    const medical = parseFloat(formData.medical_allowence || 0);
    const special = parseFloat(formData.special_allowence || 0);
    
    const totalAllowence = hra + conveyance + phone + medical + special;

    const epf = parseFloat(formData.deductions_EPF || 0);
    const esi = parseFloat(formData.deductions_ESI || 0);
    const tds = parseFloat(formData.deductions_TDS || 0);
    const pt = parseFloat(formData.deductions_professional_tax || 0);
    const otherDed = parseFloat(formData.deductions_other || 0);
    
    const lopDed = parseFloat(formData.lop_deductions || 0);
    const advDed = parseFloat(formData.advances_deducted || 0);
    const approvedReimb = parseFloat(formData.approved_reimbursements || 0);

    const grossSalary = basic + totalAllowence + approvedReimb;
    const totalDeductions = epf + esi + tds + pt + otherDed + lopDed + advDed;
    const netSalary = grossSalary - totalDeductions;

    const employerEpf = parseFloat(formData.employer_epf || 0);
    const employerEsi = parseFloat(formData.employer_esi || 0);
    const costToCompany = grossSalary + employerEpf + employerEsi;

    const handleSaveRecord = async () => {
        setIsSaving(true);
        setMessage(null);

        const payload = {
            employee: parseInt(selectedEmployeeId),
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            status: formData.status,
            payment_type: formData.payment_type,
            payment_date: formData.payment_date || null,
            
            basic_salary: parseFloat(formData.basic_salary || 0),
            house_rent_allowence: parseFloat(formData.house_rent_allowence || 0),
            conveyance_allowence: parseFloat(formData.conveyance_allowence || 0),
            phone_allowence: parseFloat(formData.phone_allowence || 0),
            medical_allowence: parseFloat(formData.medical_allowence || 0),
            special_allowence: parseFloat(formData.special_allowence || 0),
            
            deductions_EPF: parseFloat(formData.deductions_EPF || 0),
            deductions_ESI: parseFloat(formData.deductions_ESI || 0),
            deductions_TDS: parseFloat(formData.deductions_TDS || 0),
            deductions_professional_tax: parseFloat(formData.deductions_professional_tax || 0),
            deductions_other: parseFloat(formData.deductions_other || 0),
            
            lop_days: parseInt(formData.lop_days || 0),
            lop_deductions: parseFloat(formData.lop_deductions || 0),
            approved_reimbursements: parseFloat(formData.approved_reimbursements || 0),
            advances_deducted: parseFloat(formData.advances_deducted || 0),

            employer_epf: parseFloat(formData.employer_epf || 0),
            employer_esi: parseFloat(formData.employer_esi || 0),

            total_allowence: totalAllowence,
            gross_salary: grossSalary,
            total_deductions: totalDeductions,
            net_salary: netSalary,
            cost_to_company: costToCompany
        };

        try {
            if (recordId) {
                await axiosInstance.patch(`../payroll/salary-records/${recordId}/`, payload);
                setMessage({ type: 'success', text: 'Monthly payroll record saved successfully!' });
            } else {
                const res = await axiosInstance.post('../payroll/salary-records/', payload);
                setRecordId(res.data.id);
                setSalaryRecord(res.data);
                setMessage({ type: 'success', text: 'New monthly payroll record created & saved!' });
            }
            fetchSinglePayrollRecord();
        } catch (err) {
            console.error("Save error:", err);
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save payroll record.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!recordId) {
            alert("Please save the payroll record first before marking as PAID.");
            return;
        }

        if (!window.confirm("Are you sure you want to mark this payroll as PAID? This will automatically settle pending reimbursements and advance deductions.")) {
            return;
        }

        setIsProcessingPaid(true);
        setMessage(null);
        try {
            const res = await axiosInstance.post(`../payroll/salary-records/${recordId}/mark-paid/`);
            setMessage({ type: 'success', text: res.data.message || 'Payroll marked as PAID!' });
            fetchSinglePayrollRecord();
        } catch (err) {
            console.error("Mark paid error:", err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to mark payroll as PAID.' });
        } finally {
            setIsProcessingPaid(false);
        }
    };

    const isPrintDisabled = !recordId || formData.status !== 'PAID';

    const handlePrintPaySlip = () => {
        if (isPrintDisabled) return;
        navigate(`/payroll/print/${recordId}`);
    };

    const targetEmployee = employees.find(e => String(e.id) === String(selectedEmployeeId));

    // =========================================================================
    // RENDER OVERVIEW DASHBOARD VIEW
    // =========================================================================
    if (isOverviewMode) {
        return (
            <div className="monthly-salary-container">
                {/* Header */}
                <div className="ms-header">
                    <div className="ms-header-title">
                        <div style={{ marginBottom: '6px' }}>
                            <span className="landing-pill-tag">
                                <span className="tag-dot"></span> PAYROLL ENGINE
                            </span>
                        </div>
                        <h1>
                            Monthly Payroll <span className="volt-highlight">Dashboard.</span>
                        </h1>
                        <p>Total dispersable compensation, statutory compliances, and employee net take-home salaries</p>
                    </div>

                    <div className="ms-selector-group">
                        {/* Month Picker */}
                        <select 
                            className="ms-select-box"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {MONTH_OPTIONS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>

                        {/* Year Picker */}
                        <select 
                            className="ms-select-box"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Top Metrics Executive Summary */}
                {loadingOverview ? (
                    <div className="po-metrics-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="po-skeleton-card">
                                <div className="po-skeleton-line" style={{ width: '40%', height: '16px' }}></div>
                                <div className="po-skeleton-line" style={{ width: '70%', height: '36px' }}></div>
                                <div className="po-skeleton-line" style={{ width: '50%', height: '14px' }}></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="po-metrics-grid">
                        {/* Card 1: Total Dispersable Salary */}
                        <div className="po-card po-card-highlight">
                            <div className="po-card-header">
                                <span className="po-card-title">Total Dispersable Salary</span>
                                <div className="po-card-icon">💰</div>
                            </div>
                            <div className="po-card-value">
                                {formatINR(overviewCalculations.totalDispersable)}
                            </div>
                            <div className="po-card-subtext">
                                <span className="po-badge-green">
                                    ✓ Net Take-Home Payout
                                </span>
                                <span>Across {employees.length} Employee{employees.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Card 2: Total Statutory Compliances */}
                        <div className="po-card">
                            <div className="po-card-header">
                                <span className="po-card-title">Statutory Compliances</span>
                                <div className="po-card-icon">🏛</div>
                            </div>
                            <div className="po-card-value">
                                {formatINR(overviewCalculations.totalCompliances)}
                            </div>
                            <div className="po-card-subtext" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Employer Statutory & Tax Liabilities</span>
                                <div className="po-compliance-pills">
                                    <span className="po-comp-item">EPF:<strong>{formatINR(overviewCalculations.epfTotal)}</strong></span>
                                    <span className="po-comp-item">ESI:<strong>{formatINR(overviewCalculations.esiTotal)}</strong></span>
                                    <span className="po-comp-item">TDS:<strong>{formatINR(overviewCalculations.tdsTotal)}</strong></span>
                                    <span className="po-comp-item">PT:<strong>{formatINR(overviewCalculations.ptTotal)}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Cost To Company (CTC) */}
                        <div className="po-card po-card-dark">
                            <div className="po-card-header">
                                <span className="po-card-title">Total Cost to Company</span>
                                <div className="po-card-icon">🏢</div>
                            </div>
                            <div className="po-card-value">
                                {formatINR(overviewCalculations.totalCTC)}
                            </div>
                            <div className="po-card-subtext">
                                <span style={{ color: '#10B981', fontWeight: 700 }}>Gross + Employer Contributions</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toolbar & Filters */}
                <div className="po-toolbar">
                    <div className="po-search-box">
                        <span className="po-search-icon">🔍</span>
                        <input 
                            type="text" 
                            className="po-search-input"
                            placeholder="Search employee by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="po-filter-tabs">
                        {['ALL', 'DRAFT', 'APPROVED', 'PAID'].map(st => (
                            <button 
                                key={st}
                                className={`po-tab-btn ${statusFilter === st ? 'active' : ''}`}
                                onClick={() => setStatusFilter(st)}
                            >
                                {st} {st !== 'ALL' && `(${overviewCalculations.counts[st] || 0})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Employee List Table */}
                <div className="po-table-card">
                    {loadingOverview ? (
                        <div className="att-loading-zone">
                            <div className="att-pulse-loader"></div>
                            <p style={{ color: '#64748B', fontWeight: 600 }}>Loading employee compensation list...</p>
                        </div>
                    ) : filteredOverviewEmployees.length === 0 ? (
                        <div className="po-empty-state">
                            <h3>No employees found</h3>
                            <p>No employee records match the search query or status filter.</p>
                        </div>
                    ) : (
                        <div className="po-table-wrapper">
                            <table className="po-table">
                                <thead>
                                    <tr>
                                        <th>Employee Profile</th>
                                        <th>Gross Compensation</th>
                                        <th>Deductions & Tax</th>
                                        <th>Net Take-Home Salary</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOverviewEmployees.map(emp => {
                                        const initials = `${emp.first_name?.[0] || 'E'}${emp.last_name?.[0] || ''}`.toUpperCase();
                                        const nameStr = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.user?.email || 'Employee';

                                        return (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="po-emp-cell">
                                                        <div className="po-emp-avatar">{initials}</div>
                                                        <div>
                                                            <div className="po-emp-name">{nameStr}</div>
                                                            <div className="po-emp-sub">{emp.role || 'Staff Member'} • {emp.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: '#0F172A' }}>
                                                        {formatINR(emp.gross)}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Base & Allowances</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#DC2626' }}>
                                                        - {formatINR(emp.totalDeductions)}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                        EPF/ESI/TDS/LOP
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="po-net-badge">
                                                        <span className="po-net-amount">{formatINR(emp.netTakeHome)}</span>
                                                        <span className="po-net-label">Take Home</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill-lg ${emp.status}`}>
                                                        ● {emp.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button 
                                                        className="po-btn-view-more"
                                                        onClick={() => navigate(`/employees/${emp.id}/payroll`)}
                                                    >
                                                        View More →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // =========================================================================
    // RENDER SINGLE EMPLOYEE DETAILED PAYROLL VIEW (When /employees/:id/payroll)
    // =========================================================================
    return (
        <div className="monthly-salary-container">
            {/* Back Button */}
            <button className="ms-back-btn" onClick={() => navigate('/payroll')}>
                ← Back to Payroll Dashboard
            </button>

            {/* Header */}
            <div className="ms-header">
                <div className="ms-header-title">
                    <div style={{ marginBottom: '6px' }}>
                        <span className="landing-pill-tag">
                            <span className="tag-dot"></span> PAYROLL MANAGER
                        </span>
                    </div>
                    <h1>
                        Salary Breakdown <span className="volt-highlight">Statement.</span>
                    </h1>
                    <p>View, edit, compute, and disburse detailed monthly salary statement for {targetEmployee?.first_name || targetEmployee?.user?.email || 'Employee'}</p>
                </div>

                <div className="ms-selector-group">
                    {/* Month Picker */}
                    <select 
                        className="ms-select-box"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {MONTH_OPTIONS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    {/* Year Picker */}
                    <select 
                        className="ms-select-box"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notification Banner */}
            {message && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '14px',
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                    border: `1px solid ${message.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
                    color: message.type === 'success' ? '#15803D' : '#B91C1C',
                    fontWeight: 700
                }}>
                    {message.type === 'success' ? '✓ ' : '⚠️ '} {message.text}
                </div>
            )}

            {/* Status & Actions Banner */}
            <div className="ms-status-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>STATUS:</span>
                    <div className={`status-pill-lg ${formData.status}`}>
                        ● {formData.status}
                    </div>

                    <div style={{ marginLeft: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Employee: </span>
                        <strong style={{ color: '#0F172A' }}>{targetEmployee?.first_name ? `${targetEmployee.first_name} ${targetEmployee.last_name || ''}` : targetEmployee?.user?.email}</strong>
                    </div>
                </div>

                <div className="ms-action-buttons">
                    <button 
                        className="btn-print-slip"
                        onClick={handlePrintPaySlip}
                        disabled={isPrintDisabled}
                        title={isPrintDisabled ? "Payroll status must be marked as PAID to enable payslip printing" : "View & print payslip preview"}
                    >
                        🖨 Print Pay Slip
                    </button>

                    <button 
                        className="btn-save-payroll" 
                        onClick={handleSaveRecord}
                        disabled={isSaving}
                    >
                        💾 {isSaving ? 'Saving Payroll...' : 'Save Payroll Record'}
                    </button>

                    <button 
                        className="btn-mark-paid"
                        onClick={handleMarkAsPaid}
                        disabled={isProcessingPaid || formData.status === 'PAID'}
                    >
                        ✔ {isProcessingPaid ? 'Processing...' : formData.status === 'PAID' ? 'Already Paid' : 'Mark as PAID'}
                    </button>
                </div>
            </div>

            {loadingDetail ? (
                <div className="att-loading-zone">
                    <div className="att-pulse-loader"></div>
                    <p style={{ color: '#64748B', fontWeight: 600 }}>Loading monthly salary statement...</p>
                </div>
            ) : (
                <div className="ms-grid-container">
                    
                    {/* Section 1: Earnings & Allowances */}
                    <div className="ms-card-section">
                        <h3 className="ms-section-title">💵 Earnings & Allowances</h3>
                        <div className="ms-inputs-group">
                            <div className="ms-field-box">
                                <label>Basic Salary (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.basic_salary}
                                    onChange={(e) => handleChange('basic_salary', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>House Rent (HRA):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.house_rent_allowence}
                                    onChange={(e) => handleChange('house_rent_allowence', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Conveyance:</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.conveyance_allowence}
                                    onChange={(e) => handleChange('conveyance_allowence', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Phone Allowance:</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.phone_allowence}
                                    onChange={(e) => handleChange('phone_allowence', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Medical Allowance:</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.medical_allowence}
                                    onChange={(e) => handleChange('medical_allowence', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Special Allowance:</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.special_allowence}
                                    onChange={(e) => handleChange('special_allowence', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                            <div className="ms-field-box">
                                <label>Total Allowances (Computed):</label>
                                <input 
                                    type="text" readOnly className="ms-input-control computed"
                                    value={`₹ ${totalAllowence.toFixed(2)}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Statutory & Employee Deductions */}
                    <div className="ms-card-section">
                        <h3 className="ms-section-title">📉 Deductions & Adjustments</h3>
                        <div className="ms-inputs-group">
                            <div className="ms-field-box">
                                <label>EPF Employee (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.deductions_EPF}
                                    onChange={(e) => handleChange('deductions_EPF', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>ESI Employee (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.deductions_ESI}
                                    onChange={(e) => handleChange('deductions_ESI', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>TDS (Tax):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.deductions_TDS}
                                    onChange={(e) => handleChange('deductions_TDS', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Professional Tax (PT):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.deductions_professional_tax}
                                    onChange={(e) => handleChange('deductions_professional_tax', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Other Deductions:</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.deductions_other}
                                    onChange={(e) => handleChange('deductions_other', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>LOP Days Count:</label>
                                <input 
                                    type="number" className="ms-input-control"
                                    value={formData.lop_days}
                                    onChange={(e) => handleChange('lop_days', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>LOP Deductions (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.lop_deductions}
                                    onChange={(e) => handleChange('lop_deductions', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                            <div className="ms-field-box">
                                <label>Total Deductions (Computed):</label>
                                <input 
                                    type="text" readOnly className="ms-input-control computed"
                                    value={`₹ ${totalDeductions.toFixed(2)}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Reimbursements & Advances */}
                    <div className="ms-card-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid #F1F5F9' }}>
                            <h3 className="ms-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>💸 Reimbursements & Advance Recoveries</h3>
                            <button 
                                type="button"
                                onClick={handleSyncClaimsAndAdvances}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    background: '#ECFDF5',
                                    border: '1px solid #10B981',
                                    color: '#047857',
                                    fontWeight: '700',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ⚡ Sync Claims & Advances
                            </button>
                        </div>
                        <div className="ms-inputs-group">
                            <div className="ms-field-box">
                                <label>Approved Reimbursements (+):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.approved_reimbursements}
                                    onChange={(e) => handleChange('approved_reimbursements', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Advances Deducted (-):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.advances_deducted}
                                    onChange={(e) => handleChange('advances_deducted', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                                📋 Linked Approved Claims ({linkedReimbursements.filter(r => r.status === 'APPROVED').length}):
                            </div>
                            {linkedReimbursements.filter(r => r.status === 'APPROVED').slice(0, 3).map(r => (
                                <div key={r.id} style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#0F172A', fontWeight: 500 }}>{r.category} ({r.reason || 'No reason'})</span>
                                    <strong style={{ color: '#16A34A' }}>+ ₹{r.amount}</strong>
                                </div>
                            ))}

                            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '0.4rem' }}>
                                💳 Linked Approved Advances ({linkedAdvances.filter(a => a.status === 'APPROVED').length}):
                            </div>
                            {linkedAdvances.filter(a => a.status === 'APPROVED').slice(0, 3).map(a => (
                                <div key={a.id} style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#0F172A', fontWeight: 500 }}>Advance ID #{a.id} ({a.reason || 'Pending deduction'})</span>
                                    <strong style={{ color: '#DC2626' }}>- ₹{a.amount}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Employer Contributions & Payment Options */}
                    <div className="ms-card-section">
                        <h3 className="ms-section-title">🏛 Employer Contributions & Disbursement</h3>
                        <div className="ms-inputs-group">
                            <div className="ms-field-box">
                                <label>Employer EPF (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.employer_epf}
                                    onChange={(e) => handleChange('employer_epf', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Employer ESI (₹):</label>
                                <input 
                                    type="number" step="0.01" className="ms-input-control"
                                    value={formData.employer_esi}
                                    onChange={(e) => handleChange('employer_esi', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Payment Method:</label>
                                <select 
                                    className="ms-input-control"
                                    value={formData.payment_type}
                                    onChange={(e) => handleChange('payment_type', e.target.value)}
                                >
                                    {PAYMENT_TYPES.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ms-field-box">
                                <label>Payment Date:</label>
                                <input 
                                    type="date" className="ms-input-control"
                                    value={formData.payment_date}
                                    onChange={(e) => handleChange('payment_date', e.target.value)}
                                />
                            </div>

                            <div className="ms-field-box">
                                <label>Status State:</label>
                                <select 
                                    className="ms-input-control"
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    {STATUS_CHOICES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Summary Net Calculation Box */}
                        <div className="net-pay-box">
                            <span>NET PAYABLE AMOUNT (TAKE HOME)</span>
                            <h2>₹ {netSalary.toFixed(2)}</h2>
                            <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>
                                Gross: ₹{grossSalary.toFixed(2)} • Total CTC: ₹{costToCompany.toFixed(2)}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default MonthlySalary;
