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
    const [query, setQuery] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axiosInstance.get('/employees/');
                const data = response.data || [];
                const total = data.reduce((acc, emp) => acc + Number(emp.base_salary || 0), 0);
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

            {/* Metrics Grid dynamically linked to the database */}
            <div className="metrics-grid">
                <div className="metric-card">
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
                <div className="metric-card">
                    <div className="metric-top">
                        <span className="metric-label">Monthly Payroll Spend</span>
                        <span className="more-icon">...</span>
                    </div>
                    <div className="metric-value">
                        {loading ? '...' : `₹${stats.totalPayroll.toLocaleString('en-IN')}`}
                    </div>
                    <p className="metric-context">Total active salary commitments</p>
                </div>
                <div className="metric-card">
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
                <div className="activity-card glass-panel">
                    <div className="activity-content">
                        <span className="agent-badge">
                            <span className="dot"></span> WhatsApp Agent
                        </span>
                        <p className="activity-text">
                            Added <strong>10,000 Rs advance</strong> in Ravi's account.
                        </p>
                    </div>
                    <div className="activity-actions">
                        <button className="btn-modern primary">View Details</button>
                        <button className="btn-modern secondary">Reject</button>
                    </div>
                </div>
            </section>

            <section className="ai-interaction-section">
                <div className="premium-ai-search">
                    <span className="search-icon magic-icon">✨</span>
                    <input 
                        type="text" 
                        placeholder="What is this month payroll" 
                        className="ai-input active-text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="premium-generate-btn">
                         Ask AI <span className="sparkle-icon">✨</span>
                    </button>
                </div>

                <div className="example-prompts">
                    <span className="prompts-label">Try asking:</span>
                    <button type="button" className="prompt-pill" onClick={() => setQuery("What is this month's payroll?")}>
                        "What is this month's payroll?"
                    </button>
                    <button type="button" className="prompt-pill" onClick={() => setQuery("Who has the highest advance?")}>
                        "Who has highest advance?"
                    </button>
                    <button type="button" className="prompt-pill" onClick={() => setQuery("Show manager details")}>
                        "Show manager details"
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Home;