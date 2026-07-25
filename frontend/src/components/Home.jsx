import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance';
import '../style/home.css';

const Home = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
    });

    const [activities, setActivities] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);
    const [expandedActivityId, setExpandedActivityId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await axiosInstance.get('/employees/');
            const data = response.data || [];
            const total = data.reduce((acc, emp) => acc + Number(emp.basic_salary || 0), 0);
            const avg = data.length ? Math.round(total / data.length) : 0;
            setStats({
                totalEmployees: data.length,
                totalPayroll: total,
                averageSalary: avg
            });
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            setActivityLoading(true);
            const res = await axiosInstance.get('../agent/activities/');
            setActivities(res.data || []);
        } catch (err) {
            console.error("Failed to fetch agent activities:", err);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchActivities();
    }, []);

    const [prompt, setPrompt] = useState('');
    const [searchloading, setSearchLoading] = useState(false);
    const [response, setResponse] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setSearchLoading(true);
        setResponse(null);

        try {
            const res = await axiosInstance.post('../agent/search-command/', { prompt });
            if (res.data.status === 'requires_confirmation') {
                setResponse({
                    type: 'confirmation',
                    message: res.data.message,
                    details: res.data
                });
            } else {
                setResponse({
                    type: res.data.status,
                    message: res.data.message
                });
                if (res.data.status === 'success') {
                    setPrompt('');
                    fetchActivities();
                }
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process request';
            setResponse({
                type: 'error',
                message: errorMsg
            });
        } finally {
            setSearchLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!response || !response.details) return;

        setSearchLoading(true);
        const details = response.details;
        setResponse(null);

        try {
            const res = await axiosInstance.post('../agent/search-command/', {
                confirmed: true,
                parsed_data: {
                    intent: details.intent,
                    employee_id: details.employee_id,
                    amount: details.amount,
                    reason: details.reason,
                    category: details.category,
                    user_message: details.user_message
                }
            });
            setResponse({
                type: res.data.status,
                message: res.data.message
            });
            if (res.data.status === 'success') {
                setPrompt('');
                fetchActivities();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process request';
            setResponse({
                type: 'error',
                message: errorMsg
            });
        } finally {
            setSearchLoading(false);
        }
    };

    const handleCancel = () => {
        setResponse(null);
    };

    const toggleDetails = (id) => {
        setExpandedActivityId(prev => prev === id ? null : id);
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this action? The database record will be permanently deleted.")) {
            return;
        }

        setRejectingId(id);
        try {
            await axiosInstance.post(`../agent/activities/${id}/reject/`);
            setActivities(prev => prev.filter(act => act.id !== id));
            fetchStats();
        } catch (err) {
            console.error("Failed to reject activity:", err);
            alert(err.response?.data?.message || "Failed to reject activity");
        } finally {
            setRejectingId(null);
        }
    };

    const handleDismiss = (id) => {
        setDismissedIds(prev => [...prev, id]);
    };

    const activeActivities = activities.filter(act => act.status !== 'REJECTED' && !dismissedIds.includes(act.id));

    return (
        <div className="glass-dashboard">
            <header className="dashboard-header">
                <div className="header-top-tag">
                    <span className="landing-pill-tag">
                        <span className="tag-dot"></span> AI AGENT CONTROL ROOM
                    </span>
                </div>
                <div className="header-title">
                    <h1>
                        HR & Payroll on <span className="volt-highlight">AI Agent.</span> Automated.
                    </h1>
                </div>
                <p className="subtitle">Natural language HR & payroll execution engine. Monitoring employees, financial claims, and automated workflows.</p>
            </header>

            <div className="metrics-grid">
                <div className="metric-card landing-stat-card">
                    <div className="metric-top">
                        <span className="metric-label">Total Employees</span>
                        <span className="more-icon">• • •</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : stats.totalEmployees}
                        <span className="trend positive">Active</span>
                    </div>
                    <p className="metric-context">Registered in organization</p>
                </div>
                <div className="metric-card landing-stat-card">
                    <div className="metric-top">
                        <span className="metric-label">Monthly Payroll Spend</span>
                        <span className="more-icon">• • •</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : `₹${stats.totalPayroll.toLocaleString('en-IN')}`}
                    </div>
                    <p className="metric-context">Total active salary commitments</p>
                </div>
                <div className="metric-card landing-stat-card">
                    <div className="metric-top">
                        <span className="metric-label">Average Compensation</span>
                        <span className="more-icon">• • •</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : `₹${stats.averageSalary.toLocaleString('en-IN')}`}
                    </div>
                    <p className="metric-context">Average monthly salary</p>
                </div>
            </div>

            <section className="activity-section">
                <div className="section-header-tag">
                    <span className="landing-pill-tag"><span className="tag-dot"></span> LIVE DISPATCH</span>
                    <h3 className="section-heading">Recent Agent Activity</h3>
                </div>

                <div className="activity-list-container">
                    {activityLoading ? (
                        <div className="no-activity-placeholder">Loading recent activities...</div>
                    ) : activeActivities.length === 0 ? (
                        <div className="no-activity-placeholder">No active agent activity. Send a query via WhatsApp or Search Bar!</div>
                    ) : (
                        activeActivities.map((act) => {
                            const isWhatsApp = act.channel === 'WHATSAPP';
                            const isExpanded = expandedActivityId === act.id;

                            return (
                                <div key={act.id} className="activity-card-wrapper">
                                    <div className="light-glass-activity-card">
                                        <div className="activity-content">
                                            <span className={`agent-badge ${isWhatsApp ? 'whatsapp-badge' : 'searchbar-badge'}`}>
                                                <span className="dot"></span> {act.channel_display}
                                            </span>
                                            <p className="activity-text">
                                                {act.ai_response}
                                            </p>
                                        </div>
                                        <div className="activity-actions-group">
                                            <button 
                                                type="button"
                                                className="btn-glass-details" 
                                                onClick={() => toggleDetails(act.id)}
                                            >
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                            </button>
                                            <button 
                                                type="button"
                                                className="btn-glass-reject"
                                                onClick={() => handleReject(act.id)}
                                                disabled={rejectingId === act.id}
                                            >
                                                {rejectingId === act.id ? 'Deleting...' : 'Reject'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-glass-cross"
                                                title="Dismiss card from home screen"
                                                onClick={() => handleDismiss(act.id)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="light-activity-details-drawer">
                                            <div className="light-detail-query">
                                                <span className="light-detail-box-label">Original User Query:</span>
                                                <div style={{ marginTop: '4px', fontWeight: 500 }}>"{act.user_message}"</div>
                                            </div>
                                            <div className="details-grid">
                                                <div className="detail-box">
                                                    <span className="light-detail-box-label">Target Employee : </span>
                                                    <span className="light-detail-box-value">{act.employee_name}</span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="light-detail-box-label">Action Intent :  </span>
                                                    <span className="light-detail-box-value">{act.intent === 'ADVANCE' ? 'Salary Advance' : 'Reimbursement Claim'}</span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="light-detail-box-label">Amount :   </span>
                                                    <span className="light-detail-box-value">₹{Number(act.amount).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="light-detail-box-label">Category :  </span>
                                                    <span className="light-detail-box-value">{act.category}</span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="detail-box">
                                                        <span className="light-detail-box-label">Source Channel :</span>
                                                        <span className="light-detail-box-value">{act.channel_display}</span>
                                                    </span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="light-detail-box-label">Timestamp</span>
                                                    <span className="light-detail-box-value">{new Date(act.created_at).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* SEARCH BAR WITH BACKGROUND GLOW BLOBS */}
            <section className="ai-interaction-section">
                {response && (
                    <div className={`ai-response-box ${response.type}`}>
                        <div className="response-header">
                            <span className="response-indicator"></span>
                            <span className="response-title">
                                {response.type === 'success' 
                                    ? 'AI Agent Success' 
                                    : response.type === 'ambiguous' 
                                        ? 'AI Agent Ambiguity' 
                                        : response.type === 'confirmation'
                                            ? 'AI Agent Confirmation'
                                            : 'AI Agent Error'}
                            </span>
                        </div>
                        <p className="response-text">{response.message}</p>
                        
                        {response.type === 'confirmation' && response.details && (
                            <div className="confirmation-details">
                                <div className="detail-item">
                                    <span className="detail-label">Action:</span>
                                    <span className="detail-value">{response.details.intent === 'ADVANCE' ? 'Advance Payment' : 'Reimbursement Claim'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Employee:</span>
                                    <span className="detail-value">{response.details.employee_name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Amount:</span>
                                    <span className="detail-value">₹{response.details.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Reason:</span>
                                    <span className="detail-value">{response.details.reason}</span>
                                </div>
                                {response.details.intent === 'REIMBURSEMENT' && (
                                    <div className="detail-item">
                                        <span className="detail-label">Category:</span>
                                        <span className="detail-value">{response.details.category}</span>
                                    </div>
                                )}
                                <div className="confirmation-actions">
                                    <button 
                                        type="button" 
                                        className="btn-volt"
                                        onClick={handleConfirm}
                                        disabled={searchloading}
                                    >
                                        Approve Action
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-forest-outline"
                                        onClick={handleCancel}
                                        disabled={searchloading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="ai-bar-glow-container">
                    {/* Glow blobs – behind the bar */}
                    <div className="glow-blob glow-left"></div>
                    <div className="glow-blob glow-right"></div>
                    <form onSubmit={handleSubmit} className="google-search-bar landing-search-bar">
                        <span className="search-icon">⚡</span>
                        <input 
                            type="text" 
                            placeholder="Enter command (e.g. Reimburse 1500 to Ravi for travel)" 
                            className="ai-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={searchloading}
                        />
                        <button type="submit" className="ask-ai-btn volt-btn" disabled={searchloading}>
                             {searchloading ? 'Processing...' : 'Ask AI Agent'}
                        </button>
                    </form>
                </div>

                <div className="example-prompts">
                    <span className="prompts-label">Try natural commands:</span>
                    <button type="button" className="prompt-pill" onClick={() => setPrompt("Give 10000 advance to Ravi for personal emergency")} disabled={searchloading}>
                        "Give 10,000 advance to Ravi"
                    </button>
                    <button type="button" className="prompt-pill" onClick={() => setPrompt("Reimburse 1500 to Sanya for client meeting food expense")} disabled={searchloading}>
                        "Reimburse 1,500 to Sanya for food"
                    </button>
                    <button type="button" className="prompt-pill" onClick={() => setPrompt("Reimburse 3000 to Ravi for software subscription")} disabled={searchloading}>
                        "Reimburse 3,000 to Ravi for software"
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Home;