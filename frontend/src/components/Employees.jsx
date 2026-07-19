import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance';
import '../style/profile.css'; // Leverage existing premium profile CSS styles

const Employees = () => {
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
        <div className="modern-profile-view" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: '#0f172a' }}>Organization Directory</h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Manage and view all registered profiles within your active tenant organization.
                    </p>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '30px' }}>
                    Active Employees: {employees.length}
                </div>
            </div>

            {error && (
                <div className="modern-error-toast">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {employees.length === 0 ? (
                <div className="glass-profile-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No employees onboarded yet.</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Go to "Add Employee" in the sidebar to onboard your first colleague.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                    {employees.map((emp) => {
                        const seedName = emp.user?.first_name || 'User';
                        const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${seedName}`;
                        return (
                            <div key={emp.id} className="glass-profile-card" style={{ marginBottom: 0 }}>
                                {/* Banner */}
                                <div className="profile-card-banner" style={{ height: '80px' }}></div>

                                {/* Header with identity */}
                                <div className="profile-identity-header" style={{ marginTop: '-40px', padding: '0 1.5rem 1rem 1.5rem', gap: '1rem' }}>
                                    <div className="avatar-wrapper-glass" style={{ width: '70px', height: '70px', padding: '4px' }}>
                                        <img src={avatarUrl} alt="Avatar" className="notionist-avatar" />
                                    </div>
                                    <div className="identity-text-group" style={{ marginBottom: 0 }}>
                                        <div className="name-badge-row" style={{ gap: '0.35rem' }}>
                                            <h3 style={{ fontSize: '1.15rem' }}>{emp.user?.first_name || 'User'} {emp.user?.last_name || ''}</h3>
                                            <span className={`role-tag-pill ${emp.role?.toLowerCase()}`} style={{ fontSize: '0.55rem', padding: '0.15rem 0.5rem' }}>{emp.role}</span>
                                        </div>
                                        <p className="profile-email-sub" style={{ fontSize: '0.8rem' }}>{emp.user?.email}</p>
                                    </div>
                                </div>

                                {/* Quick metrics */}
                                <div className="profile-metrics-grid" style={{ padding: '0 1.5rem 1rem 1.5rem', gap: '0.75rem' }}>
                                    <div className="metric-glass-tile" style={{ padding: '0.75rem' }}>
                                        <span className="metric-lbl" style={{ fontSize: '0.6rem' }}>Base Salary</span>
                                        <span className="metric-val" style={{ fontSize: '0.95rem' }}>{emp.base_salary ? `$${Number(emp.base_salary).toLocaleString()}` : '—'}</span>
                                    </div>
                                    <div className="metric-glass-tile" style={{ padding: '0.75rem' }}>
                                        <span className="metric-lbl" style={{ fontSize: '0.6rem' }}>Joined Date</span>
                                        <span className="metric-val" style={{ fontSize: '0.95rem' }}>{emp.date_of_joining || '—'}</span>
                                    </div>
                                </div>

                                {/* Body with personal and banking details */}
                                <div className="profile-details-body" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                    <div className="section-divider-title" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.65rem' }}>Contact & Address</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Phone:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }}>{emp.phone_number || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Address:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b', maxWidth: '70%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={emp.address}>
                                                {emp.address || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="section-divider-title" style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.65rem' }}>Banking & Identity</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>PAN:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }} className="code-font">{emp.pan_number || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Aadhaar:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }} className="code-font">{emp.aadhaar_number || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Account No:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }} className="code-font">{emp.bank_account_number || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>IFSC:</span>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }} className="code-font">{emp.ifsc_code || '—'}</span>
                                        </div>
                                    </div>
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
