import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import '../style/employeeattendance.css';

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const EmployeeAttendance = () => {
    const { id } = useParams();
    const { userProfile } = useContext(AuthContext);

    const [employee, setEmployee] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Calendar Navigation State
    const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

    // Modal Edit State
    const [selectedDayLog, setSelectedDayLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalForm, setModalForm] = useState({
        date: '',
        status: 'Present',
        check_in_time: '',
        check_out_time: '',
        is_lop: false,
        lop_override_amount: '0.00'
    });
    const [isSaving, setIsSaving] = useState(false);

    const isOwner = userProfile?.role === 'OWNER';

    const fetchData = async () => {
        setLoading(true);

        // 1. Fetch employee profile independently
        try {
            const empRes = await axiosInstance.get(`employees/${id}/`);
            setEmployee(empRes.data);
        } catch (err) {
            console.error("Error fetching employee details:", err);
            setEmployee(null);
        }

        // 2. Fetch attendance logs independently
        try {
            const logsRes = await axiosInstance.get(`../payroll/attendance/?employee=${id}`);
            setLogs(logsRes.data || []);
        } catch (err) {
            console.error("Error fetching attendance logs:", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Navigate Month
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    // Build log map by date string YYYY-MM-DD
    const logsByDate = {};
    logs.forEach(log => {
        if (log.date) {
            logsByDate[log.date] = log;
        }
    });

    // Compute Metrics for current selected month
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;

    logs.forEach(log => {
        if (log.date) {
            const d = new Date(log.date);
            if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
                if (log.status === 'Present') presentCount++;
                else if (log.status === 'Absent') absentCount++;
                else if (log.status === 'Late') lateCount++;
                else if (log.status === 'Leave') leaveCount++;
                else if (log.status === 'Holiday') holidayCount++;
            }
        }
    });

    const totalLogged = presentCount + absentCount + lateCount + leaveCount;
    const presentRate = totalLogged > 0 ? Math.round(((presentCount + lateCount) / totalLogged) * 100) : 100;

    // Days in Month calculation
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...

    const handleOpenDayModal = (dateStr, existingLog) => {
        setSelectedDayLog(existingLog || null);
        setModalForm({
            date: dateStr,
            status: existingLog?.status || 'Present',
            check_in_time: existingLog?.check_in_time || '09:00',
            check_out_time: existingLog?.check_out_time || '18:00',
            is_lop: existingLog?.is_lop || false,
            lop_override_amount: existingLog?.lop_override_amount || '0.00'
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDayLog(null);
    };

    const handleSaveLog = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                employee: parseInt(id),
                date: modalForm.date,
                status: modalForm.status,
                check_in_time: modalForm.check_in_time || null,
                check_out_time: modalForm.check_out_time || null,
                is_lop: modalForm.status === 'Absent' ? true : modalForm.is_lop,
                lop_override_amount: parseFloat(modalForm.lop_override_amount || 0)
            };

            if (selectedDayLog) {
                await axiosInstance.patch(`../payroll/attendance/${selectedDayLog.id}/`, payload);
            } else {
                await axiosInstance.post('../payroll/attendance/', payload);
            }

            handleCloseModal();
            fetchData();
        } catch (err) {
            console.error("Save log error:", err);
            alert(err.response?.data?.detail || "Failed to save attendance record.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="emp-att-container">
                <div style={{ textAlign: 'center', padding: '5rem', color: '#64748B' }}>
                    <div className="att-pulse-loader" style={{ margin: '0 auto 1.5rem auto' }}></div>
                    <h2>Loading attendance dashboard...</h2>
                </div>
            </div>
        );
    }

    const fullName = employee
        ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.user?.email
        : `Employee #${id}`;
    const seed = id;
    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="emp-att-container">
            {/* Header */}
            <div className="emp-att-header">
                <div className="emp-att-profile-summary">
                    <img src={avatarUrl} alt={fullName} className="emp-att-avatar" />
                    <div className="emp-att-info">
                        <h1>{fullName}</h1>
                        <p>{employee?.role || 'Employee'} • {employee?.user?.email || '—'} • ID: #{id}</p>
                    </div>
                </div>

                <Link to="/attendance" className="btn-back-link">
                    ← Back to All Attendance
                </Link>
            </div>

            {/* Metrics Dashboard */}
            <div className="emp-att-metrics-grid">
                <div className="metric-card">
                    <div className="metric-card-label">Present Days</div>
                    <div className="metric-card-value">{presentCount}</div>
                    <div className="metric-card-accent" style={{ background: '#10B981' }}></div>
                </div>

                <div className="metric-card">
                    <div className="metric-card-label">Absences / LOP</div>
                    <div className="metric-card-value">{absentCount}</div>
                    <div className="metric-card-accent" style={{ background: '#EF4444' }}></div>
                </div>

                <div className="metric-card">
                    <div className="metric-card-label">Late Arrivals</div>
                    <div className="metric-card-value">{lateCount}</div>
                    <div className="metric-card-accent" style={{ background: '#F59E0B' }}></div>
                </div>

                <div className="metric-card">
                    <div className="metric-card-label">Leaves Taken</div>
                    <div className="metric-card-value">{leaveCount}</div>
                    <div className="metric-card-accent" style={{ background: '#3B82F6' }}></div>
                </div>

                <div className="metric-card">
                    <div className="metric-card-label">Attendance Score</div>
                    <div className="metric-card-value">{presentRate}%</div>
                    <div className="metric-card-accent" style={{ background: '#00A86B' }}></div>
                </div>
            </div>

            {/* Interactive Calendar Card */}
            <div className="calendar-card">
                <div className="calendar-controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button className="month-nav-btn" onClick={handlePrevMonth}>‹</button>
                        <span className="calendar-title-text">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </span>
                        <button className="month-nav-btn" onClick={handleNextMonth}>›</button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>
                        💡 Click on any day cell to view or mark attendance details
                    </div>
                </div>

                {/* Day Labels */}
                <div className="calendar-grid-header">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>

                {/* Days Grid */}
                <div className="calendar-days-grid">
                    {/* Empty padding slots before day 1 */}
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="day-cell empty"></div>
                    ))}

                    {/* Day Cells */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                        const formattedDay = String(dayNum).padStart(2, '0');
                        const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

                        const log = logsByDate[dateStr];
                        const isToday = dateStr === todayStr;

                        return (
                            <div 
                                key={dateStr} 
                                className={`day-cell ${isToday ? 'today' : ''}`}
                                onClick={() => handleOpenDayModal(dateStr, log)}
                            >
                                <span className="day-number">{dayNum}</span>

                                {log ? (
                                    <div className={`day-status-pill ${log.status}`}>
                                        {log.status}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textAlign: 'center' }}>
                                        + Add
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Attendance Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📅 Log Attendance: {modalForm.date}</h3>
                            <button className="btn-close-modal" onClick={handleCloseModal}>×</button>
                        </div>

                        <form onSubmit={handleSaveLog} className="modal-body-form">
                            <div className="form-group-field">
                                <label>Attendance Status:</label>
                                <select 
                                    value={modalForm.status} 
                                    onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent (LOP Trigger)</option>
                                    <option value="Late">Late Arrival</option>
                                    <option value="Leave">On Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group-field">
                                    <label>Check In Time:</label>
                                    <input 
                                        type="time" 
                                        value={modalForm.check_in_time}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group-field">
                                    <label>Check Out Time:</label>
                                    <input 
                                        type="time" 
                                        value={modalForm.check_out_time}
                                        onChange={(e) => setModalForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-group-field">
                                <label>LOP Override Amount (₹):</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={modalForm.lop_override_amount}
                                    onChange={(e) => setModalForm(prev => ({ ...prev, lop_override_amount: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>

                            <button type="submit" className="btn-submit-save" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Attendance Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;
