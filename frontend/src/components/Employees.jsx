import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import '../style/employeesList.css'; 

const Employees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/employees/');
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch employees.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    if (loading) {
        return (
            <div className="modern-loading-zone">
                <div className="ui-pulse-loader"></div>
                <p>Loading organization directory...</p>
            </div>
        );
    }

    return (
        <div className="modern-profile-view">
            {/* Header Section */}
            <div className="emp-header-actions">
                <div className="emp-header-title">
                    <h2>{employees.length} Employee</h2>
                    <p>Active team members within your organization</p>
                </div>
                <div className="emp-header-controls">
                    <button className="btn-emp-filter">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        Filter
                    </button>
                    <button className="btn-emp-add" onClick={() => navigate('/add-employee')}>
                        <span>+</span> Add Employee
                    </button>
                </div>
            </div>

            {error && (
                <div className="modern-error-toast">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Employee Grid */}
            {employees.length === 0 ? (
                <div className="glass-profile-card empty-state">
                    <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No employees onboarded yet.</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0', color: '#64748b' }}>Click "Add Employee" to get started.</p>
                </div>
            ) : (
                <div className="emp-grid">
                    {employees.map((emp) => {
                        const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${emp.id}`;
                        return (
                            <div key={emp.id} className="glass-profile-card employee-card-modern">
                                
                                {/* Card Header */}
                                <div className="emp-card-header">
                                    <div className="emp-avatar-wrapper">
                                        <img src={avatarUrl} alt="Avatar" className="emp-avatar-img" />
                                        <span className="status-dot"></span>
                                    </div>
                                    <div className="emp-card-info">
                                        <h3>{emp.first_name || 'Name'} {emp.last_name || ''}</h3>
                                        <span className="role-text">{emp.role || '—'}</span>
                                    </div>
                                    <button className="emp-card-menu" title="Manage">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <circle cx="12" cy="5" r="2" />
                                            <circle cx="12" cy="12" r="2" />
                                            <circle cx="12" cy="19" r="2" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Metrics (Salary & Date) */}
                                <div className="emp-metrics-grid">
                                    <div className="metric-glass-tile">
                                        <span className="metric-lbl">Basic Salary</span>
                                        <span className="metric-val">
                                            {emp.basic_salary ? `₹${Number(emp.basic_salary).toLocaleString()}` : '—'}
                                        </span>
                                    </div>
                                    <div className="metric-glass-tile">
                                        <span className="metric-lbl">Joined Date</span>
                                        <span className="metric-val">{emp.date_of_joining || '—'}</span>
                                    </div>
                                </div>

                                {/* Contact Footer */}
                                <div className="emp-contact-footer">
                                    <div className="contact-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                            <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"></path>
                                        </svg>
                                        <span>{emp.user?.email || '—'}</span>
                                    </div>
                                    <div className="contact-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                                        </svg>
                                        <span>{emp.phone_number || '—'}</span>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="emp-card-footer-modern">
                                    <Link to={`/employees/${emp.id}`} className="btn-emp-edit-icon" title="Edit Profile">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </Link>
                                    <Link to={`/employees/${emp.id}/finance`} className="btn-emp-view-finance">
                                        View Finances
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Employees;