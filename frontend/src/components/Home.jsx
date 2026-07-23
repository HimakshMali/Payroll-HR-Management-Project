import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance';
import '../style/home.css';

const Home = () => {

    
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStats();



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
                    category: details.category
                }
            });
            setResponse({
                type: res.data.status,
                message: res.data.message
            });
            if (res.data.status === 'success') {
                setPrompt('');
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

    return (
        <div className="glass-dashboard">
            <header className="dashboard-header">
                <div className="header-title">
                    <span className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    </span>
                    <h1>Agent Control Center</h1>
                </div>
                <p className="subtitle">Your AI control room - monitoring employees, payroll, and actions</p>
            </header>

            <div className="metrics-grid">
                <div className="metric-card glass-agentic-card">
                    <div className="metric-top">
                        <span className="metric-label">Total Employees</span>
                        <span className="more-icon">...</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : stats.totalEmployees}
                        <span className="trend positive">Active</span>
                    </div>
                    <p className="metric-context">Registered in organization</p>
                </div>
                <div className="metric-card glass-agentic-card">
                    <div className="metric-top">
                        <span className="metric-label">Monthly Payroll Spend</span>
                        <span className="more-icon">...</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : `₹${stats.totalPayroll.toLocaleString('en-IN')}`}
                    </div>
                    <p className="metric-context">Total active salary commitments</p>
                </div>
                <div className="metric-card glass-agentic-card">
                    <div className="metric-top">
                        <span className="metric-label">Average Compensation</span>
                        <span className="more-icon">...</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : `₹${stats.averageSalary.toLocaleString('en-IN')}`}
                    </div>
                    <p className="metric-context">Average monthly salary</p>
                </div>
            </div>

            <section className="activity-section">
                <h3 className="section-heading">Recent Agent Activity</h3>
                <div className="activity-card glass-agentic-card">
                    <div className="activity-content">
                        <span className="agent-badge">
                            <span className="dot"></span> WhatsApp Agent
                        </span>
                        <p className="activity-text">
                            Added <strong>10,000 Rs advance</strong> in Ravi's account.
                        </p>
                    </div>
                    <div className="activity-actions">
                        <button className="btn-modern primary agentic-btn">View Details</button>
                        <button className="btn-modern secondary">Reject</button>
                    </div>
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
                                        className="btn-modern primary agentic-btn"
                                        onClick={handleConfirm}
                                        disabled={searchloading}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-modern secondary"
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
                    <form onSubmit={handleSubmit} className="google-search-bar">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Enter command (e.g. Reimburse 1500 to Ravi for travel)" 
                            className="ai-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={searchloading}
                        />
                        <button type="submit" className="ask-ai-btn" disabled={searchloading}>
                             {searchloading ? 'Processing...' : 'Ask AI'}
                        </button>
                    </form>
                </div>

                <div className="example-prompts">
                    <span className="prompts-label">Try asking:</span>
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