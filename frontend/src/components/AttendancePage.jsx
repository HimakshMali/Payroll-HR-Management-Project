import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import '../style/attendancepage.css';

const AttendancePage = () => {
    const { userProfile } = useContext(AuthContext);
    const [employees, setEmployees] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isBatchUpdating, setIsBatchUpdating] = useState(false);

    const isOwner = userProfile?.role === 'OWNER';

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch employees independently
        try {
            const empRes = await axiosInstance.get('/employees/');
            setEmployees(empRes.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        }

        // 2. Fetch attendance logs for selected date independently
        try {
            const attRes = await axiosInstance.get(`../payroll/attendance/?date=${selectedDate}`);
            setAttendanceLogs(attRes.data || []);
        } catch (err) {
            console.error("Error fetching attendance logs:", err);
            setAttendanceLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    // Map logs by employee ID specifically for the selected date
    const logMap = {};
    attendanceLogs.forEach(log => {
        if (log.date === selectedDate) {
            logMap[log.employee] = log;
        }
    });

    const handleMarkStatus = async (employeeId, statusValue) => {
        setUpdatingId(employeeId);
        const existingLog = logMap[employeeId];

        try {
            if (existingLog && existingLog.date === selectedDate) {
                const res = await axiosInstance.patch(`../payroll/attendance/${existingLog.id}/`, {
                    employee: employeeId,
                    date: selectedDate,
                    status: statusValue,
                    is_lop: statusValue === 'Absent'
                });
                setAttendanceLogs(prev => prev.map(l => l.id === existingLog.id ? res.data : l));
            } else {
                const res = await axiosInstance.post('../payroll/attendance/', {
                    employee: employeeId,
                    date: selectedDate,
                    status: statusValue,
                    is_lop: statusValue === 'Absent'
                });
                setAttendanceLogs(prev => [...prev.filter(l => l.id !== res.data.id), res.data]);
            }
        } catch (err) {
            console.error("Failed to update attendance status:", err);
            alert("Failed to update status. Please try again.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleMarkAllPresent = async () => {
        if (!window.confirm(`Mark all unassigned employees as PRESENT for ${selectedDate}?`)) return;
        setIsBatchUpdating(true);
        try {
            const promises = employees.map(async (emp) => {
                const existingLog = logMap[emp.id];
                if (!existingLog || existingLog.date !== selectedDate) {
                    return axiosInstance.post('../payroll/attendance/', {
                        employee: emp.id,
                        date: selectedDate,
                        status: 'Present',
                        is_lop: false
                    });
                }
                return null;
            });

            await Promise.all(promises);
            await fetchData();
        } catch (err) {
            console.error("Batch update failed:", err);
            alert("Some records could not be updated.");
        } finally {
            setIsBatchUpdating(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const name = `${emp.first_name || ''} ${emp.last_name || ''} ${emp.user?.email || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    // Compute stats for selectedDate
    const totalCount = employees.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;

    attendanceLogs.forEach(log => {
        if (log.date === selectedDate) {
            if (log.status === 'Present') presentCount++;
            else if (log.status === 'Absent') absentCount++;
            else if (log.status === 'Late') lateCount++;
            else if (log.status === 'Leave') leaveCount++;
            else if (log.status === 'Holiday') holidayCount++;
        }
    });

    return (
        <div className="attendance-page-container">
            {/* Header */}
            <div className="attendance-header">
                <div className="attendance-title-box">
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                            <polyline points="9 16 11 18 15 14"></polyline>
                        </svg>
                        Daily Attendance Tracker
                    </h1>
                    <p>Log, manage, and monitor employee daily presence in real-time</p>
                </div>

                <div className="attendance-header-actions">
                    <div className="date-picker-wrapper">
                        <label htmlFor="att-date-picker">Date:</label>
                        <input 
                            id="att-date-picker"
                            type="date" 
                            className="date-picker-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {isOwner && (
                        <button 
                            className="btn-batch-present"
                            onClick={handleMarkAllPresent}
                            disabled={isBatchUpdating || loading}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            {isBatchUpdating ? 'Updating...' : 'Mark All Unmarked Present'}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Summary Bar */}
            <div className="attendance-stats-bar">
                <div className="stat-pill-card">
                    <div className="stat-pill-icon present">✓</div>
                    <div className="stat-pill-info">
                        <span>Present</span>
                        <h3>{presentCount} <small style={{fontSize: '0.75rem', color: '#64748B'}}>/ {totalCount}</small></h3>
                    </div>
                </div>

                <div className="stat-pill-card">
                    <div className="stat-pill-icon absent">✕</div>
                    <div className="stat-pill-info">
                        <span>Absent / LOP</span>
                        <h3>{absentCount}</h3>
                    </div>
                </div>

                <div className="stat-pill-card">
                    <div className="stat-pill-icon late">⏰</div>
                    <div className="stat-pill-info">
                        <span>Late Arrived</span>
                        <h3>{lateCount}</h3>
                    </div>
                </div>

                <div className="stat-pill-card">
                    <div className="stat-pill-icon leave">✈</div>
                    <div className="stat-pill-info">
                        <span>On Leave</span>
                        <h3>{leaveCount}</h3>
                    </div>
                </div>

                <div className="stat-pill-card">
                    <div className="stat-pill-icon holiday">🎉</div>
                    <div className="stat-pill-info">
                        <span>Holiday</span>
                        <h3>{holidayCount}</h3>
                    </div>
                </div>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <input 
                    type="text"
                    placeholder="🔍 Search employee by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '0.65rem 1.2rem',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        color: '#0F172A',
                        width: '100%',
                        maxWidth: '360px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                />
            </div>

            {/* Content List */}
            {loading ? (
                <div className="att-loading-zone">
                    <div className="att-pulse-loader"></div>
                    <p style={{ color: '#64748B', fontWeight: 600 }}>Syncing attendance registers for {selectedDate}...</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ color: '#0F172A' }}>No employees found</h3>
                    <p>Try searching with another name or add new employees in Organization Settings.</p>
                </div>
            ) : (
                <div className="attendance-grid">
                    {filteredEmployees.map((emp) => {
                        const log = logMap[emp.id];
                        const currentStatus = log?.status || 'Unmarked';
                        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.user?.email || `Employee #${emp.id}`;
                        const seed = emp.id;
                        const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(seed)}`;

                        return (
                            <div key={emp.id} className="employee-att-card">
                                <div className="emp-card-header">
                                    <img src={avatarUrl} alt={fullName} className="emp-avatar" />
                                    <div className="emp-meta">
                                        <h3 className="emp-name">{fullName}</h3>
                                        <div className="emp-role">{emp.role} • {emp.employment_type || 'Full-time'}</div>
                                        <div className="emp-email">{emp.user?.email}</div>
                                    </div>
                                </div>

                                <div className={`current-status-badge ${currentStatus}`}>
                                    <span>Status:</span>
                                    <strong>{currentStatus}</strong>
                                </div>

                                {isOwner && (
                                    <div className="status-actions-group">
                                        <button 
                                            className={`btn-status-option ${currentStatus === 'Present' ? 'active-present' : ''}`}
                                            onClick={() => handleMarkStatus(emp.id, 'Present')}
                                            disabled={updatingId === emp.id}
                                        >
                                            ✓ Present
                                        </button>

                                        <button 
                                            className={`btn-status-option ${currentStatus === 'Absent' ? 'active-absent' : ''}`}
                                            onClick={() => handleMarkStatus(emp.id, 'Absent')}
                                            disabled={updatingId === emp.id}
                                        >
                                            ✕ Absent
                                        </button>

                                        <button 
                                            className={`btn-status-option ${currentStatus === 'Late' ? 'active-late' : ''}`}
                                            onClick={() => handleMarkStatus(emp.id, 'Late')}
                                            disabled={updatingId === emp.id}
                                        >
                                            ⏰ Late
                                        </button>

                                        <button 
                                            className={`btn-status-option ${currentStatus === 'Leave' ? 'active-leave' : ''}`}
                                            onClick={() => handleMarkStatus(emp.id, 'Leave')}
                                            disabled={updatingId === emp.id}
                                        >
                                            ✈ Leave
                                        </button>

                                        <button 
                                            className={`btn-status-option ${currentStatus === 'Holiday' ? 'active-holiday' : ''}`}
                                            onClick={() => handleMarkStatus(emp.id, 'Holiday')}
                                            disabled={updatingId === emp.id}
                                        >
                                            🎉 Holiday
                                        </button>
                                    </div>
                                )}

                                <div className="emp-card-footer">
                                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>ID: #{emp.id}</span>
                                    <Link to={`/employees/${emp.id}/attendance`} className="view-calendar-link">
                                        View Calendar Dashboard →
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

export default AttendancePage;
