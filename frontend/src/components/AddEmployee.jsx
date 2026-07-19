import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from './AxiosInstance';
import '../style/addemployee.css';

const AddEmployee = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Account Info
        email: '',
        password: '',
        role: 'EMPLOYEE',

        // Step 2: Personal Info
        first_name: '',
        middle_name: '',
        last_name: '',
        phone_number: '',
        address: '',
        date_of_joining: '',
        employment_type: 'Full-time',

        // Step 3: Document Details
        pan_number: '',
        aadhaar_number: '',
        bank_account_number: '',
        ifsc_code: '',

        // Step 4: Salary & Allowances
        basic_salary: '',
        special_allowence: '',
        house_rent_allowence: '',
        conveyance_allowence: '',
        phone_allowence: '',
        medical_allowence: '',

        // Step 5: Deductions
        deductions_EPF: '',
        deductions_ESI: '',
        deductions_TDS: '',
        deductions_professional_tax: '',
        deductions_other: '',
        employer_epf: '',
        employer_esi: '',
    });

    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const steps = [
        { id: 1, label: 'STEP 1', title: 'Account Info', desc: 'Login credentials' },
        { id: 2, label: 'STEP 2', title: 'Personal Info', desc: 'Identity & Address' },
        { id: 3, label: 'STEP 3', title: 'Documents Info', desc: 'ID cards & Bank' },
        { id: 4, label: 'STEP 4', title: 'Salary Details', desc: 'Pay & Allowances' },
        { id: 5, label: 'STEP 5', title: 'Deductions', desc: 'Taxes & PF contributions' },
        { id: 6, label: 'STEP 6', title: 'Overview', desc: 'Review & Submit' }
    ];

    // Curated network illustrations/images matching each onboarding step
    const stepImages = {
        1: 'https://i.pinimg.com/736x/13/5d/6c/135d6c81b4b03da679355d6120375c6f.jpg',
        2: 'https://i.pinimg.com/1200x/26/79/6e/26796e40fffc35888c16872183ca78c7.jpg',
        3: 'https://i.pinimg.com/736x/16/45/4d/16454de59468c9692c7f9493e18c3365.jpg',
        4: 'https://i.pinimg.com/736x/f6/12/5e/f6125e248743ef72f90b2692ffb4b9fe.jpg',
        5: 'https://i.pinimg.com/736x/32/84/72/3284728084eede9f40d4cb69ff1e1800.jpg',
        6: 'https://i.pinimg.com/1200x/1c/19/a9/1c19a985d166bc08ef5236886d60e282.jpg'
    };

    const parseNumeric = (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0.00 : parsed;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    // Client side validator for each individual step before navigation
    const validateStep = (step) => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (step === 1) {
            if (!formData.email) newErrors.email = 'Email is required';
            else if (!emailRegex.test(formData.email)) newErrors.email = 'Please provide a valid email format';
            if (!formData.password) newErrors.password = 'Password is required';
            else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
        } 
        else if (step === 2) {
            if (!formData.first_name) newErrors.first_name = 'First name is required';
            if (!formData.last_name) newErrors.last_name = 'Last name is required';
            if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
            if (!formData.address) newErrors.address = 'Current address is required';
            if (!formData.date_of_joining) newErrors.date_of_joining = 'Date of joining is required';
        }
        else if (step === 3) {
            if (!formData.pan_number) newErrors.pan_number = 'PAN Card Number is required';
            if (!formData.bank_account_number) newErrors.bank_account_number = 'Bank Account Number is required';
            if (!formData.ifsc_code) newErrors.ifsc_code = 'IFSC Code is required';
        }
        else if (step === 4) {
            if (!formData.basic_salary) newErrors.basic_salary = 'Basic salary is required';
            else if (isNaN(Number(formData.basic_salary)) || Number(formData.basic_salary) <= 0) {
                newErrors.basic_salary = 'Please enter a valid basic salary (> 0)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            setMessage('');
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setMessage('');
    };

    const handleStepClick = (stepId) => {
        // Allow backtracking or jumping back, but validate if going forward
        if (stepId < currentStep) {
            setCurrentStep(stepId);
            setMessage('');
        } else {
            // Must validate intermediate steps to jump forward
            for (let s = currentStep; s < stepId; s++) {
                if (!validateStep(s)) {
                    setCurrentStep(s);
                    return;
                }
            }
            setCurrentStep(stepId);
            setMessage('');
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // Complete client-side evaluation checks
        let isValid = true;
        for (let s = 1; s <= 4; s++) {
            if (!validateStep(s)) {
                setCurrentStep(s);
                isValid = false;
                break;
            }
        }
        if (!isValid) return;

        setIsSubmitting(true);
        setMessage('');
        setErrors({});
        setSuccess(false);

        try {
            // 1. Create Core User Account, Employee Profile, and Salary Components atomically in backend
            const profilePayload = {
                email: formData.email,
                password: formData.password,
                role: 'EMPLOYEE',
                first_name: formData.first_name,
                middle_name: formData.middle_name || '',
                last_name: formData.last_name,
                employment_type: formData.employment_type,
                phone_number: formData.phone_number,
                address: formData.address,
                date_of_joining: formData.date_of_joining,
                pan_number: formData.pan_number,
                aadhaar_number: formData.aadhaar_number || null,
                bank_account_number: formData.bank_account_number,
                ifsc_code: formData.ifsc_code,
                basic_salary: parseNumeric(formData.basic_salary),
                special_allowence: parseNumeric(formData.special_allowence),
                house_rent_allowence: parseNumeric(formData.house_rent_allowence),
                conveyance_allowence: parseNumeric(formData.conveyance_allowence),
                phone_allowence: parseNumeric(formData.phone_allowence),
                medical_allowence: parseNumeric(formData.medical_allowence),
                deductions_EPF: parseNumeric(formData.deductions_EPF),
                deductions_ESI: parseNumeric(formData.deductions_ESI),
                deductions_TDS: parseNumeric(formData.deductions_TDS),
                deductions_professional_tax: parseNumeric(formData.deductions_professional_tax),
                deductions_other: parseNumeric(formData.deductions_other),
                employer_epf: parseNumeric(formData.employer_epf),
                employer_esi: parseNumeric(formData.employer_esi)
            };

            const profileResponse = await AxiosInstance.post('/employees/', profilePayload);
            
            if (profileResponse.status === 201 || profileResponse.status === 200) {
                const newEmployeeId = profileResponse.data.id;

                setMessage('✅ Employee profile successfully created and salary ledger initialized!');
                setSuccess(true);
                
                // Reset form values
                setFormData({
                    email: '',
                    password: '',
                    role: 'EMPLOYEE',
                    first_name: '',
                    middle_name: '',
                    last_name: '',
                    phone_number: '',
                    address: '',
                    date_of_joining: '',
                    employment_type: 'Full-time',
                    pan_number: '',
                    aadhaar_number: '',
                    bank_account_number: '',
                    ifsc_code: '',
                    basic_salary: '',
                    special_allowence: '',
                    house_rent_allowence: '',
                    conveyance_allowence: '',
                    phone_allowence: '',
                    medical_allowence: '',
                    deductions_EPF: '',
                    deductions_ESI: '',
                    deductions_TDS: '',
                    deductions_professional_tax: '',
                    deductions_other: '',
                    employer_epf: '',
                    employer_esi: '',
                });
                
                // Navigate directly to the detail view
                navigate(`/employees/${newEmployeeId}`);
            }
        } catch (error) {
            console.error('Onboarding flow error:', error);
            if (error.response && error.response.data) {
                const apiErrors = error.response.data;
                setErrors(apiErrors);
                setMessage('❌ Failed to onboard employee. Please check validation errors.');
                
                // Route user to the matching page where errors occured
                const errorKeys = Object.keys(apiErrors);
                if (errorKeys.some(k => ['email', 'password'].includes(k))) {
                    setCurrentStep(1);
                } else if (errorKeys.some(k => ['first_name', 'last_name', 'phone_number', 'address', 'date_of_joining', 'employment_type'].includes(k))) {
                    setCurrentStep(2);
                } else if (errorKeys.some(k => ['pan_number', 'aadhaar_number', 'bank_account_number', 'ifsc_code'].includes(k))) {
                    setCurrentStep(3);
                } else if (errorKeys.some(k => ['basic_salary', 'special_allowence'].includes(k))) {
                    setCurrentStep(4);
                } else {
                    setCurrentStep(5);
                }
            } else {
                setMessage('❌ Network communication failed. Try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate dynamic percentage
    const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

    return (
        <div className="onboard-page-wrapper">
            <div className="stepper-container">
                {/* LEFT SIDEBAR: Stepper steps list & animated graphics */}
                <div className="stepper-sidebar">
                    {/* Background images crossfade wrapper */}
                    {Object.entries(stepImages).map(([stepId, imgUrl]) => (
                        <div 
                            key={stepId}
                            className={currentStep === parseInt(stepId) ? "sidebar-bg-image active" : "sidebar-bg-image"}
                            style={{ 
                                backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%), url(${imgUrl})` 
                            }}
                        />
                    ))}

                    <div className="steps-list" style={{ position: 'relative', zIndex: 2 }}>
                        {steps.map((step) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            let classNames = 'step-item';
                            if (isActive) classNames += ' active';
                            if (isCompleted) classNames += ' completed';

                            return (
                                <div 
                                    key={step.id} 
                                    className={classNames}
                                    onClick={() => handleStepClick(step.id)}
                                >
                                    <div className="step-number">
                                        {isCompleted ? '✓' : step.id}
                                    </div>
                                    <div className="step-info">
                                        <span className="step-lbl">{step.label}</span>
                                        <span className="step-title">{step.title}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE: Active Form Content */}
                <div className="stepper-form-content">
                    <div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar-fill" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        <div className="form-header">
                            <h2>{steps[currentStep - 1].title}</h2>
                            <p>{steps[currentStep - 1].desc}</p>
                        </div>

                        {message && (
                            <div className={`status-msg-box ${success ? 'success' : 'error'}`}>
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="form-body">
                            {/* STEP 1: Account credentials */}
                            {currentStep === 1 && (
                                <div className="form-grid">
                                    <div className="input-group full-width">
                                        <label>Email Address</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={formData.email} 
                                            onChange={handleChange} 
                                            placeholder="e.g. employee@company.com"
                                            required 
                                        />
                                        {errors.email && <span className="input-error">{errors.email}</span>}
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Password</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            placeholder="Minimum 8 characters"
                                            required 
                                        />
                                        {errors.password && <span className="input-error">{errors.password}</span>}
                                        <ul className="custom-hints">
                                            <li>Must contain at least 8 characters</li>
                                            <li>Must contain one special character</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Personal details */}
                            {currentStep === 2 && (
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>First Name</label>
                                        <input 
                                            type="text" 
                                            name="first_name" 
                                            value={formData.first_name} 
                                            onChange={handleChange} 
                                            placeholder="e.g. John"
                                            required 
                                        />
                                        {errors.first_name && <span className="input-error">{errors.first_name}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Last Name</label>
                                        <input 
                                            type="text" 
                                            name="last_name" 
                                            value={formData.last_name} 
                                            onChange={handleChange} 
                                            placeholder="e.g. Doe"
                                            required 
                                        />
                                        {errors.last_name && <span className="input-error">{errors.last_name}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Middle Name (Optional)</label>
                                        <input 
                                            type="text" 
                                            name="middle_name" 
                                            value={formData.middle_name} 
                                            onChange={handleChange} 
                                            placeholder="e.g. Alan"
                                        />
                                        {errors.middle_name && <span className="input-error">{errors.middle_name}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Employment Type</label>
                                        <select 
                                            name="employment_type" 
                                            value={formData.employment_type} 
                                            onChange={handleChange} 
                                            required
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                            <option value="Temporary">Temporary</option>
                                        </select>
                                        {errors.employment_type && <span className="input-error">{errors.employment_type}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Phone Number</label>
                                        <input 
                                            type="text" 
                                            name="phone_number" 
                                            value={formData.phone_number} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 9876543210"
                                            required 
                                        />
                                        {errors.phone_number && <span className="input-error">{errors.phone_number}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Date of Joining</label>
                                        <input 
                                            type="date" 
                                            name="date_of_joining" 
                                            value={formData.date_of_joining} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                        {errors.date_of_joining && <span className="input-error">{errors.date_of_joining}</span>}
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Address</label>
                                        <textarea 
                                            name="address" 
                                            value={formData.address} 
                                            onChange={handleChange} 
                                            placeholder="Full permanent residential address details"
                                            required 
                                        />
                                        {errors.address && <span className="input-error">{errors.address}</span>}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Identification & banking */}
                            {currentStep === 3 && (
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>PAN Card Number</label>
                                        <input 
                                            type="text" 
                                            name="pan_number" 
                                            value={formData.pan_number} 
                                            onChange={handleChange} 
                                            placeholder="e.g. ABCDE1234F"
                                            maxLength="10"
                                            required 
                                        />
                                        {errors.pan_number && <span className="input-error">{errors.pan_number}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Aadhaar Card Number (Optional)</label>
                                        <input 
                                            type="text" 
                                            name="aadhaar_number" 
                                            value={formData.aadhaar_number} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 123456789012"
                                            maxLength="12"
                                        />
                                        {errors.aadhaar_number && <span className="input-error">{errors.aadhaar_number}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Bank Account Number</label>
                                        <input 
                                            type="text" 
                                            name="bank_account_number" 
                                            value={formData.bank_account_number} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 12345678901234"
                                            required 
                                        />
                                        {errors.bank_account_number && <span className="input-error">{errors.bank_account_number}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>IFSC Code</label>
                                        <input 
                                            type="text" 
                                            name="ifsc_code" 
                                            value={formData.ifsc_code} 
                                            onChange={handleChange} 
                                            placeholder="e.g. SBIN0001234"
                                            maxLength="11"
                                            required 
                                        />
                                        {errors.ifsc_code && <span className="input-error">{errors.ifsc_code}</span>}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Salary & Allowances */}
                            {currentStep === 4 && (
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Basic Salary (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="basic_salary" 
                                            value={formData.basic_salary} 
                                            onChange={handleChange} 
                                            placeholder="Must be >= 50% of Gross salary"
                                            required 
                                        />
                                        {errors.basic_salary && <span className="input-error">{errors.basic_salary}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>House Rent Allowance (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="house_rent_allowence" 
                                            value={formData.house_rent_allowence} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 15000"
                                        />
                                        {errors.house_rent_allowence && <span className="input-error">{errors.house_rent_allowence}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Conveyance Allowance (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="conveyance_allowence" 
                                            value={formData.conveyance_allowence} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 1600"
                                        />
                                        {errors.conveyance_allowence && <span className="input-error">{errors.conveyance_allowence}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Medical Allowance (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="medical_allowence" 
                                            value={formData.medical_allowence} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 1250"
                                        />
                                        {errors.medical_allowence && <span className="input-error">{errors.medical_allowence}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Phone/Internet Allowance (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="phone_allowence" 
                                            value={formData.phone_allowence} 
                                            onChange={handleChange} 
                                            placeholder="e.g. 1000"
                                        />
                                        {errors.phone_allowence && <span className="input-error">{errors.phone_allowence}</span>}
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Special Allowance (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="special_allowence" 
                                            value={formData.special_allowence} 
                                            onChange={handleChange} 
                                            placeholder="Flexible allowance elements"
                                        />
                                        {errors.special_allowence && <span className="input-error">{errors.special_allowence}</span>}
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Deductions */}
                            {currentStep === 5 && (
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Deductions EPF (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="deductions_EPF" 
                                            value={formData.deductions_EPF} 
                                            onChange={handleChange} 
                                            placeholder="Employee Provident Fund deduction"
                                        />
                                        {errors.deductions_EPF && <span className="input-error">{errors.deductions_EPF}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Deductions ESI (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="deductions_ESI" 
                                            value={formData.deductions_ESI} 
                                            onChange={handleChange} 
                                            placeholder="State Insurance deduction"
                                        />
                                        {errors.deductions_ESI && <span className="input-error">{errors.deductions_ESI}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Deductions TDS (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="deductions_TDS" 
                                            value={formData.deductions_TDS} 
                                            onChange={handleChange} 
                                            placeholder="Tax Deducted at Source (TDS)"
                                        />
                                        {errors.deductions_TDS && <span className="input-error">{errors.deductions_TDS}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Professional Tax (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="deductions_professional_tax" 
                                            value={formData.deductions_professional_tax} 
                                            onChange={handleChange} 
                                            placeholder="Statutory State Professional Tax"
                                        />
                                        {errors.deductions_professional_tax && <span className="input-error">{errors.deductions_professional_tax}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Other Deductions (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="deductions_other" 
                                            value={formData.deductions_other} 
                                            onChange={handleChange} 
                                            placeholder="Other structural deductions"
                                        />
                                        {errors.deductions_other && <span className="input-error">{errors.deductions_other}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Employer EPF contribution (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="employer_epf" 
                                            value={formData.employer_epf} 
                                            onChange={handleChange} 
                                            placeholder="Employer provident contribution"
                                        />
                                        {errors.employer_epf && <span className="input-error">{errors.employer_epf}</span>}
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Employer ESI contribution (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="employer_esi" 
                                            value={formData.employer_esi} 
                                            onChange={handleChange} 
                                            placeholder="Employer insurance contribution"
                                        />
                                        {errors.employer_esi && <span className="input-error">{errors.employer_esi}</span>}
                                    </div>
                                </div>
                            )}

                            {/* STEP 6: Complete Overview */}
                            {currentStep === 6 && (
                                <div className="summary-card">
                                    <div className="summary-section">
                                        <div className="summary-section-title">Login Credentials</div>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">Email Address</span>
                                                <span className="summary-value">{formData.email}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Password</span>
                                                <span className="summary-value">********</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-section">
                                        <div className="summary-section-title">Personal Information</div>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">Full Name</span>
                                                <span className="summary-value">
                                                    {formData.first_name} {formData.middle_name ? `${formData.middle_name} ` : ''}{formData.last_name}
                                                </span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Employment Type</span>
                                                <span className="summary-value">{formData.employment_type}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Phone Number</span>
                                                <span className="summary-value">{formData.phone_number}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Date of Joining</span>
                                                <span className="summary-value">{formData.date_of_joining}</span>
                                            </div>
                                            <div className="summary-item full-width" style={{ marginTop: '4px' }}>
                                                <span className="summary-label">Address</span>
                                                <span className="summary-value">{formData.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-section">
                                        <div className="summary-section-title">Document & Banking Details</div>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">PAN Number</span>
                                                <span className="summary-value">{formData.pan_number.toUpperCase()}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Aadhaar Number</span>
                                                <span className="summary-value">{formData.aadhaar_number || '—'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Bank Account Number</span>
                                                <span className="summary-value">{formData.bank_account_number}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">IFSC Code</span>
                                                <span className="summary-value">{formData.ifsc_code.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-section">
                                        <div className="summary-section-title">Salary & Allowances</div>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">Base Salary</span>
                                                <span className="summary-value">₹{Number(formData.base_salary).toLocaleString()}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Basic Salary</span>
                                                <span className="summary-value">₹{Number(formData.basic_salary).toLocaleString()}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">House Rent Allowance</span>
                                                <span className="summary-value">₹{formData.house_rent_allowence ? Number(formData.house_rent_allowence).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Conveyance Allowance</span>
                                                <span className="summary-value">₹{formData.conveyance_allowence ? Number(formData.conveyance_allowence).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Medical Allowance</span>
                                                <span className="summary-value">₹{formData.medical_allowence ? Number(formData.medical_allowence).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Phone Allowance</span>
                                                <span className="summary-value">₹{formData.phone_allowence ? Number(formData.phone_allowence).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Special Allowance</span>
                                                <span className="summary-value">₹{formData.special_allowence ? Number(formData.special_allowence).toLocaleString() : '0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-section">
                                        <div className="summary-section-title">Deductions & Contributions</div>
                                        <div className="summary-grid">
                                            <div className="summary-item">
                                                <span className="summary-label">Employee EPF Deduction</span>
                                                <span className="summary-value">₹{formData.deductions_EPF ? Number(formData.deductions_EPF).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Employee ESI Deduction</span>
                                                <span className="summary-value">₹{formData.deductions_ESI ? Number(formData.deductions_ESI).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">TDS (Tax Withholding)</span>
                                                <span className="summary-value">₹{formData.deductions_TDS ? Number(formData.deductions_TDS).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Professional Tax</span>
                                                <span className="summary-value">₹{formData.deductions_professional_tax ? Number(formData.deductions_professional_tax).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Other Deductions</span>
                                                <span className="summary-value">₹{formData.deductions_other ? Number(formData.deductions_other).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Employer EPF Contribution</span>
                                                <span className="summary-value">₹{formData.employer_epf ? Number(formData.employer_epf).toLocaleString() : '0'}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="summary-label">Employer ESI Contribution</span>
                                                <span className="summary-value">₹{formData.employer_esi ? Number(formData.employer_esi).toLocaleString() : '0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Actions Panel */}
                    <div className="stepper-actions">
                        {currentStep > 1 ? (
                            <button 
                                type="button" 
                                className="btn-back" 
                                onClick={handleBack}
                                disabled={isSubmitting}
                            >
                                Go Back
                            </button>
                        ) : (
                            <div></div> // Empty spacer to push next button to right side
                        )}

                        {currentStep < steps.length ? (
                            <button 
                                type="button" 
                                className="btn-next" 
                                onClick={handleNext}
                            >
                                Next Step
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                className="btn-submit" 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Onboarding employee...' : 'Confirm & Onboard'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmployee;