import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance';
import '../style/profile.css';

const Profile = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [editForm, setEditForm] = useState({
        role: '',
        phone_number: '',
        address: '',
        date_of_joining: '',
        pan_number: '',
        bank_account_number: '',
        ifsc_code: ''
    });

    const fetchMyProfile = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/employees/me/');
            setEmployee(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyProfile();
    }, []);

    const handleStartEdit = (emp) => {
        setEditingId(emp.id);
        setEditForm({
            role: emp.role || '',
            phone_number: emp.phone_number || '',
            address: emp.address || '',
            date_of_joining: emp.date_of_joining || '',
            pan_number: emp.pan_number || '',
            bank_account_number: emp.bank_account_number || '',
            ifsc_code: emp.ifsc_code || ''
        });
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await axiosInstance.patch(`/employees/${id}/`, editForm);
            setEmployee(response.data);
            setEditingId(null);
            setError(null);
            alert('Profile updated successfully!');
        } catch (err) {
            const serverErrors = err.response?.data;
            if (serverErrors && typeof serverErrors === 'object') {
                setError(Object.entries(serverErrors).map(([k, v]) => `${k}: ${v}`).join(' | '));
            } else {
                setError(err.response?.data?.detail || 'Authorization restriction encountered.');
            }
        }
    };

    if (loading) {
        return (
            <div className="modern-loading-zone">
                <div className="ui-pulse-loader"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="modern-profile-view">
                <div className="modern-error-toast">
                    <span>⚠️</span>
                    <p>{error || 'Profile not found.'}</p>
                </div>
            </div>
        );
    }

    // Render single card (same as before, unchanged)
    const emp = employee;
    const seedName = emp.user?.first_name || 'User';
    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${seedName}`;
    const isEditing = editingId === emp.id;

    return (    
        <div className="modern-profile-view">
            {error && (
                <div className="modern-error-toast">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            <div className="profile-cards-stack">
                <div key={emp.id} className={`glass-profile-card ${isEditing ? 'card-active-edit' : ''}`}>
                    {/* Banner */}
                    <div className="profile-card-banner">
                        <div className="banner-gradient-accent"></div>
                    </div>

                    {/* Identity Header */}
                    <div className="profile-identity-header">
                        <div className="avatar-wrapper-glass">
                            <img src={avatarUrl} alt="Avatar" className="notionist-avatar" />
                        </div>
                        <div className="identity-text-group">
                            <div className="name-badge-row">
                                <h3>{emp.user?.first_name || 'User'} {emp.user?.last_name || ''}</h3>
                                {emp.role === 'OWNER' && <span className="verified-badge-pill">✓</span>}
                                <span className={`role-tag-pill ${emp.role?.toLowerCase()}`}>{emp.role}</span>
                            </div>
                            <p className="profile-email-sub">{emp.user?.email}</p>
                        </div>
                        
                        <div className="profile-top-actions">
                            {isEditing ? (
                                <div className="glass-btn-cluster">
                                    <button onClick={() => handleSaveEdit(emp.id)} className="btn-ui-save">Save</button>
                                    <button onClick={() => setEditingId(null)} className="btn-ui-cancel">Cancel</button>
                                </div>
                            ) : (
                                <button onClick={() => handleStartEdit(emp)} className="btn-ui-configure">Edit Profile</button>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="profile-metrics-grid">
                        <div className="metric-glass-tile">
                            <span className="metric-lbl">Basic Salary</span>
                            <span className="metric-val">
                                {emp.basic_salary ? `₹${Number(emp.basic_salary).toLocaleString()}` : '—'}
                            </span>
                        </div>
                        <div className="metric-glass-tile">
                            <span className="metric-lbl">Date of Joining</span>
                            <span className="metric-val">
                                {isEditing ? (
                                    <input 
                                        type="date" 
                                        className="inline-glass-input" 
                                        value={editForm.date_of_joining} 
                                        onChange={(e) => setEditForm({...editForm, date_of_joining: e.target.value})} 
                                    />
                                ) : (
                                    emp.date_of_joining || '—'
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Details Body */}
                    <div className="profile-details-body">
                        
                        <div className="section-divider-title">
                            <span>PERSONAL INFORMATION</span>
                        </div>
                        <div className="input-fields-row-grid">
                            <div className="modern-input-wrapper">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="glass-form-input" 
                                        value={editForm.phone_number} 
                                        onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} 
                                    />
                                ) : (
                                    <div className="static-data-field">{emp.phone_number || '—'}</div>
                                )}
                            </div>
                            <div className="modern-input-wrapper">
                                <label>Address</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="glass-form-input" 
                                        value={editForm.address} 
                                        onChange={(e) => setEditForm({...editForm, address: e.target.value})} 
                                    />
                                ) : (
                                    <div className="static-data-field">{emp.address || '—'}</div>
                                )}
                            </div>
                        </div>

                        <div className="section-divider-title mt-4">
                            <span>BANKING & TAX INFORMATION</span>
                        </div>
                        <div className="input-fields-row-grid triple-col">
                            <div className="modern-input-wrapper">
                                <label>PAN Number</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="glass-form-input code-font" 
                                        value={editForm.pan_number} 
                                        onChange={(e) => setEditForm({...editForm, pan_number: e.target.value})} 
                                    />
                                ) : (
                                    <div className="static-data-field code-font">{emp.pan_number || '—'}</div>
                                )}
                            </div>
                            <div className="modern-input-wrapper">
                                <label>Bank Account Number</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="glass-form-input code-font" 
                                        value={editForm.bank_account_number} 
                                        onChange={(e) => setEditForm({...editForm, bank_account_number: e.target.value})} 
                                    />
                                ) : (
                                    <div className="static-data-field code-font">{emp.bank_account_number || '—'}</div>
                                )}
                            </div>
                            <div className="modern-input-wrapper">
                                <label>IFSC Code</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="glass-form-input code-font" 
                                        value={editForm.ifsc_code} 
                                        onChange={(e) => setEditForm({...editForm, ifsc_code: e.target.value})} 
                                    />
                                ) : (
                                    <div className="static-data-field code-font">{emp.ifsc_code || '—'}</div>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="section-divider-title mt-4">
                                <span>ORGANIZATION ROLE</span>
                            </div>
                        )}
                        {isEditing && (
                            <div className="input-fields-row-grid">
                                <div className="modern-input-wrapper">
                                    <label>Role</label>
                                    <select 
                                        className="glass-form-select" 
                                        value={editForm.role} 
                                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                    >
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="OWNER">OWNER</option>
                                    </select>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;