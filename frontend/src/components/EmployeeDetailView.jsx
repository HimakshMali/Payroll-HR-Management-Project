import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import '../style/employeedetail.css';

const EmployeeDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Core data states
    const [profile, setProfile] = useState(null);
    const [salaryDetails, setSalaryDetails] = useState(null);
    
    // Editing state mirroring formData structure
    const [editData, setEditData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        employment_type: '',
        phone_number: '',
        address: '',
        date_of_joining: '',
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

    const parseNumeric = (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0.00 : parsed;
    };

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch employee profile
            const profileRes = await axiosInstance.get(`/employees/${id}/`);
            setProfile(profileRes.data);
            
            // 2. Fetch salary components associated with this employee
            const salaryRes = await axiosInstance.get(`../payroll/salary-components/?employee=${id}`);
            let salaryData = null;
            if (salaryRes.data && salaryRes.data.length > 0) {
                salaryData = salaryRes.data[0];
                setSalaryDetails(salaryData);
            }
            
            // 3. Initialize edit form states
            setEditData({
                first_name: profileRes.data.first_name || '',
                middle_name: profileRes.data.middle_name || '',
                last_name: profileRes.data.last_name || '',
                employment_type: profileRes.data.employment_type || 'Full-time',
                phone_number: profileRes.data.phone_number || '',
                address: profileRes.data.address || '',
                date_of_joining: profileRes.data.date_of_joining || '',
                pan_number: profileRes.data.pan_number || '',
                aadhaar_number: profileRes.data.aadhaar_number || '',
                bank_account_number: profileRes.data.bank_account_number || '',
                ifsc_code: profileRes.data.ifsc_code || '',
                
                basic_salary: salaryData ? salaryData.basic_salary : '',
                special_allowence: salaryData ? salaryData.special_allowence : '',
                house_rent_allowence: salaryData ? salaryData.house_rent_allowence : '',
                conveyance_allowence: salaryData ? salaryData.conveyance_allowence : '',
                phone_allowence: salaryData ? salaryData.phone_allowence : '',
                medical_allowence: salaryData ? salaryData.medical_allowence : '',
                
                deductions_EPF: salaryData ? salaryData.deductions_EPF : '',
                deductions_ESI: salaryData ? salaryData.deductions_ESI : '',
                deductions_TDS: salaryData ? salaryData.deductions_TDS : '',
                deductions_professional_tax: salaryData ? salaryData.deductions_professional_tax : '',
                deductions_other: salaryData ? salaryData.deductions_other : '',
                employer_epf: salaryData ? salaryData.employer_epf : '',
                employer_esi: salaryData ? salaryData.employer_esi : '',
            });
            setErrors({});
            setMessage('');
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to fetch employee profiles. Please check resource URL.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEmployeeDetails();
        }
    }, [id]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateForm = () => {
        const nextErrors = {};
        if (!editData.first_name) nextErrors.first_name = 'First name is required';
        if (!editData.last_name) nextErrors.last_name = 'Last name is required';
        if (!editData.phone_number) nextErrors.phone_number = 'Phone number is required';
        if (!editData.address) nextErrors.address = 'Current address is required';
        if (!editData.date_of_joining) nextErrors.date_of_joining = 'Date of joining is required';
        
        if (!editData.pan_number) nextErrors.pan_number = 'PAN Card Number is required';
        if (!editData.bank_account_number) nextErrors.bank_account_number = 'Bank Account Number is required';
        if (!editData.ifsc_code) nextErrors.ifsc_code = 'IFSC Code is required';
        
        if (!editData.basic_salary) nextErrors.basic_salary = 'Basic salary is required';
        else if (isNaN(Number(editData.basic_salary)) || Number(editData.basic_salary) <= 0) {
            nextErrors.basic_salary = 'Please enter a valid basic salary';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        setMessage('');
        setErrors({});
        setSuccess(false);

        try {
            // 1. Prepare profile payload
            const profilePayload = {
                first_name: editData.first_name,
                middle_name: editData.middle_name || '',
                last_name: editData.last_name,
                employment_type: editData.employment_type,
                phone_number: editData.phone_number,
                address: editData.address,
                date_of_joining: editData.date_of_joining,
                pan_number: editData.pan_number,
                aadhaar_number: editData.aadhaar_number || null,
                bank_account_number: editData.bank_account_number,
                ifsc_code: editData.ifsc_code,
            };

            const profileRes = await axiosInstance.patch(`/employees/${id}/`, profilePayload);
            setProfile(profileRes.data);

            // 2. Prepare salary components payload
            if (salaryDetails && salaryDetails.id) {
                const salaryPayload = {
                    basic_salary: parseNumeric(editData.basic_salary),
                    special_allowence: parseNumeric(editData.special_allowence),
                    house_rent_allowence: parseNumeric(editData.house_rent_allowence),
                    conveyance_allowence: parseNumeric(editData.conveyance_allowence),
                    phone_allowence: parseNumeric(editData.phone_allowence),
                    medical_allowence: parseNumeric(editData.medical_allowence),
                    deductions_EPF: parseNumeric(editData.deductions_EPF),
                    deductions_ESI: parseNumeric(editData.deductions_ESI),
                    deductions_TDS: parseNumeric(editData.deductions_TDS),
                    deductions_professional_tax: parseNumeric(editData.deductions_professional_tax),
                    deductions_other: parseNumeric(editData.deductions_other),
                    employer_epf: parseNumeric(editData.employer_epf),
                    employer_esi: parseNumeric(editData.employer_esi),
                };

                const salaryRes = await axiosInstance.patch(`../payroll/salary-components/${salaryDetails.id}/`, salaryPayload);
                setSalaryDetails(salaryRes.data);
            }

            setMessage('✅ Profile details and salary components updated successfully!');
            setSuccess(true);
            setIsEditing(false);
            
            // Re-fetch details to sync dynamic calculated fields (gross salary, net salary, etc.)
            setTimeout(() => {
                fetchEmployeeDetails();
            }, 300);
        } catch (err) {
            console.error('Update error:', err);
            if (err.response && err.response.data) {
                setErrors(err.response.data);
                setMessage('❌ Update failed. Please check validation warnings.');
            } else {
                setMessage('❌ Network/Server error occurred while saving.');
            }
        }
    };

    if (loading) {
        return (
            <div className="detail-loading-zone">
                <div className="detail-pulse-loader"></div>
                <p>Retrieving employee ledger details...</p>
            </div>
        );
    }

    const seedName = profile?.first_name || 'Employee';
    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${id}`;

    return (
        <div className="detail-page-wrapper">
            <div className="detail-container">
                
                {/* 1. Glassmorphic header card with actions */}
                <div className="detail-header-card">
                    <div className="detail-header-left">
                        <div className="detail-avatar-wrapper">
                            <img src={avatarUrl} alt="Avatar" className="detail-avatar-img" />
                        </div>
                        <div className="detail-title-group">
                            <h2>{profile?.first_name} {profile?.last_name}</h2>
                            <div className="detail-badges">
                                <span className={`detail-badge-role ${profile?.role?.toLowerCase()}`}>
                                    {profile?.role}
                                </span>
                                <span className="detail-badge-type">
                                    {profile?.employment_type}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="detail-header-actions">
                        <Link to="/employees" className="btn-back-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Directory
                        </Link>
                        
                        {!isEditing ? (
                            <button className="btn-edit" onClick={() => setIsEditing(true)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                                </svg>
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button className="btn-cancel" onClick={() => { setIsEditing(false); fetchEmployeeDetails(); }}>
                                    Cancel
                                </button>
                                <button className="btn-save" onClick={handleSave}>
                                    Save Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`status-msg-box ${success ? 'success' : 'error'}`} style={{ marginBottom: 0 }}>
                        <span>{message}</span>
                    </div>
                )}

                {/* 2. Content grid */}
                <div className="detail-grid">
                    
                    {/* CARD 1: Personal Details */}
                    <div className="detail-card">
                        <div className="detail-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Personal Profile
                        </div>
                        
                        <div className="detail-item-list">
                            <div className="detail-field">
                                <span className="detail-label">First Name</span>
                                {isEditing ? (
                                    <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">{profile?.first_name}</span>
                                )}
                                {errors.first_name && <span className="error-field">{errors.first_name}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Last Name</span>
                                {isEditing ? (
                                    <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">{profile?.last_name}</span>
                                )}
                                {errors.last_name && <span className="error-field">{errors.last_name}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Middle Name</span>
                                {isEditing ? (
                                    <input type="text" name="middle_name" value={editData.middle_name} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">{profile?.middle_name || '—'}</span>
                                )}
                                {errors.middle_name && <span className="error-field">{errors.middle_name}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Employment Type</span>
                                {isEditing ? (
                                    <select name="employment_type" value={editData.employment_type} onChange={handleEditChange} required>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Temporary">Temporary</option>
                                    </select>
                                ) : (
                                    <span className="detail-value">{profile?.employment_type}</span>
                                )}
                                {errors.employment_type && <span className="error-field">{errors.employment_type}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Phone Number</span>
                                {isEditing ? (
                                    <input type="text" name="phone_number" value={editData.phone_number} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">{profile?.phone_number || '—'}</span>
                                )}
                                {errors.phone_number && <span className="error-field">{errors.phone_number}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Date of Joining</span>
                                {isEditing ? (
                                    <input type="date" name="date_of_joining" value={editData.date_of_joining} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">{profile?.date_of_joining}</span>
                                )}
                                {errors.date_of_joining && <span className="error-field">{errors.date_of_joining}</span>}
                            </div>
                            
                            <div className="detail-field full-row">
                                <span className="detail-label">Address</span>
                                {isEditing ? (
                                    <textarea name="address" value={editData.address} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">{profile?.address}</span>
                                )}
                                {errors.address && <span className="error-field">{errors.address}</span>}
                            </div>
                        </div>
                    </div>
                    
                    {/* CARD 2: Identity & Banking details */}
                    <div className="detail-card">
                        <div className="detail-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                                <line x1="16" y1="21" x2="16" y2="3"></line>
                                <line x1="8" y1="21" x2="8" y2="3"></line>
                            </svg>
                            Banking & Identity
                        </div>
                        
                        <div className="detail-item-list">
                            <div className="detail-field">
                                <span className="detail-label">PAN Card Number</span>
                                {isEditing ? (
                                    <input type="text" name="pan_number" value={editData.pan_number} onChange={handleEditChange} maxLength="10" required />
                                ) : (
                                    <span className="detail-value font-mono">{profile?.pan_number?.toUpperCase()}</span>
                                )}
                                {errors.pan_number && <span className="error-field">{errors.pan_number}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Aadhaar Card Number</span>
                                {isEditing ? (
                                    <input type="text" name="aadhaar_number" value={editData.aadhaar_number} onChange={handleEditChange} maxLength="12" />
                                ) : (
                                    <span className="detail-value font-mono">{profile?.aadhaar_number || '—'}</span>
                                )}
                                {errors.aadhaar_number && <span className="error-field">{errors.aadhaar_number}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Bank Account Number</span>
                                {isEditing ? (
                                    <input type="text" name="bank_account_number" value={editData.bank_account_number} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value font-mono">{profile?.bank_account_number}</span>
                                )}
                                {errors.bank_account_number && <span className="error-field">{errors.bank_account_number}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">IFSC Code</span>
                                {isEditing ? (
                                    <input type="text" name="ifsc_code" value={editData.ifsc_code} onChange={handleEditChange} maxLength="11" required />
                                ) : (
                                    <span className="detail-value font-mono">{profile?.ifsc_code?.toUpperCase()}</span>
                                )}
                                {errors.ifsc_code && <span className="error-field">{errors.ifsc_code}</span>}
                            </div>
                        </div>
                    </div>
                    
                    {/* CARD 3: Salary Components & allowances */}
                    <div className="detail-card">
                        <div className="detail-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            Salary Details & Allowances
                        </div>
                        
                        <div className="detail-item-list">
                            <div className="detail-field">
                                <span className="detail-label">Basic Salary (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="basic_salary" value={editData.basic_salary} onChange={handleEditChange} required />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.basic_salary || 0).toLocaleString()}</span>
                                )}
                                {errors.basic_salary && <span className="error-field">{errors.basic_salary}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">House Rent Allowance (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="house_rent_allowence" value={editData.house_rent_allowence} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.house_rent_allowence || 0).toLocaleString()}</span>
                                )}
                                {errors.house_rent_allowence && <span className="error-field">{errors.house_rent_allowence}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Conveyance Allowance (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="conveyance_allowence" value={editData.conveyance_allowence} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.conveyance_allowence || 0).toLocaleString()}</span>
                                )}
                                {errors.conveyance_allowence && <span className="error-field">{errors.conveyance_allowence}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Medical Allowance (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="medical_allowence" value={editData.medical_allowence} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.medical_allowence || 0).toLocaleString()}</span>
                                )}
                                {errors.medical_allowence && <span className="error-field">{errors.medical_allowence}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Phone Allowance (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="phone_allowence" value={editData.phone_allowence} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.phone_allowence || 0).toLocaleString()}</span>
                                )}
                                {errors.phone_allowence && <span className="error-field">{errors.phone_allowence}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Special Allowance (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="special_allowence" value={editData.special_allowence} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.special_allowence || 0).toLocaleString()}</span>
                                )}
                                {errors.special_allowence && <span className="error-field">{errors.special_allowence}</span>}
                            </div>

                            {!isEditing && (
                                <div className="detail-field">
                                    <span className="detail-label" style={{ color: '#10b981' }}>Gross Salary (Calculated)</span>
                                    <span className="detail-value" style={{ fontWeight: 700, color: '#10b981' }}>
                                        ₹{Number(salaryDetails?.gross_salary || 0).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* CARD 4: Deductions details */}
                    <div className="detail-card">
                        <div className="detail-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Deductions & Contributions
                        </div>
                        
                        <div className="detail-item-list">
                            <div className="detail-field">
                                <span className="detail-label">Employee EPF Deduction (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="deductions_EPF" value={editData.deductions_EPF} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.deductions_EPF || 0).toLocaleString()}</span>
                                )}
                                {errors.deductions_EPF && <span className="error-field">{errors.deductions_EPF}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Employee ESI Deduction (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="deductions_ESI" value={editData.deductions_ESI} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.deductions_ESI || 0).toLocaleString()}</span>
                                )}
                                {errors.deductions_ESI && <span className="error-field">{errors.deductions_ESI}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Income Tax (TDS) (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="deductions_TDS" value={editData.deductions_TDS} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.deductions_TDS || 0).toLocaleString()}</span>
                                )}
                                {errors.deductions_TDS && <span className="error-field">{errors.deductions_TDS}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Professional Tax (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="deductions_professional_tax" value={editData.deductions_professional_tax} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.deductions_professional_tax || 0).toLocaleString()}</span>
                                )}
                                {errors.deductions_professional_tax && <span className="error-field">{errors.deductions_professional_tax}</span>}
                            </div>
                            
                            <div className="detail-field">
                                <span className="detail-label">Other Deductions (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="deductions_other" value={editData.deductions_other} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.deductions_other || 0).toLocaleString()}</span>
                                )}
                                {errors.deductions_other && <span className="error-field">{errors.deductions_other}</span>}
                            </div>

                            <div className="detail-field">
                                <span className="detail-label">Employer EPF Contribution (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="employer_epf" value={editData.employer_epf} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.employer_epf || 0).toLocaleString()}</span>
                                )}
                                {errors.employer_epf && <span className="error-field">{errors.employer_epf}</span>}
                            </div>

                            <div className="detail-field">
                                <span className="detail-label">Employer ESI Contribution (₹)</span>
                                {isEditing ? (
                                    <input type="number" step="0.01" name="employer_esi" value={editData.employer_esi} onChange={handleEditChange} />
                                ) : (
                                    <span className="detail-value">₹{Number(salaryDetails?.employer_esi || 0).toLocaleString()}</span>
                                )}
                                {errors.employer_esi && <span className="error-field">{errors.employer_esi}</span>}
                            </div>

                            {!isEditing && (
                                <div className="detail-field">
                                    <span className="detail-label" style={{ color: '#ef4444' }}>Total Deductions (Calculated)</span>
                                    <span className="detail-value" style={{ fontWeight: 700, color: '#ef4444' }}>
                                        -₹{Number(salaryDetails?.total_deductions || 0).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 5: Computed Totals & Net Pay (Full Width) */}
                    {!isEditing && (
                        <div className="detail-card full-width">
                            <div className="detail-card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                                    <path d="m9 12 2 2 4-4"></path>
                                </svg>
                                Calculated Financial Summary
                            </div>
                            <div className="detail-item-list">
                                <div className="detail-field">
                                    <span className="detail-label" style={{ fontSize: '0.85rem' }}>Gross Salary</span>
                                    <span className="detail-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                        ₹{Number(salaryDetails?.gross_salary || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-label" style={{ fontSize: '0.85rem' }}>Total Deductions</span>
                                    <span className="detail-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                                        ₹{Number(salaryDetails?.total_deductions || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-label" style={{ fontSize: '0.85rem', color: '#10b981' }}>Net Take-Home Pay</span>
                                    <span className="detail-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                                        ₹{Number(salaryDetails?.net_salary || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-label" style={{ fontSize: '0.85rem', color: '#4f46e5' }}>Cost to Company (CTC)</span>
                                    <span className="detail-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>
                                        ₹{Number(salaryDetails?.cost_to_company || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailView;
