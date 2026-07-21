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
            // POST to your new AI Agent endpoint using relative URL to base API
            const res = await axiosInstance.post('../agent/search-command/', { prompt });
            
            // Store response (e.g. success or ambiguous message)
            setResponse({
                type: res.data.status,
                message: res.data.message
            });
            
            // Clear input only on success
            if (res.data.status === 'success') {
                setPrompt('');
            }
        } catch (err) {
            // Handle missing employee, ambiguity, or API errors
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process request';
            setResponse({
                type: 'error',
                message: errorMsg
            });
        } finally {
            setSearchLoading(false);
        }
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

            {/* Metrics Grid dynamically linked to the database */}
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

            {/* DeepSeek style floating bottom search bar */}
            <section className="ai-interaction-section">
                <form onSubmit={handleSubmit} className="premium-ai-search glass-agentic-card">
                    <span className="search-icon magic-icon">✨</span>
                    <input 
                        type="text" 
                        placeholder="Enter command (e.g. Reimburse 1500 to Ravi for travel)" 
                        className="ai-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={searchloading}
                    />
                    <button type="submit" className="premium-generate-btn agentic-btn" disabled={searchloading}>
                         {searchloading ? 'Processing...' : 'Ask AI'}
                    </button>
                </form>

                {response && (
                    <div className={`ai-response-box ${response.type}`}>
                        <div className="response-header">
                            <span className="response-indicator"></span>
                            <span className="response-title">
                                {response.type === 'success' 
                                    ? 'AI Agent Success' 
                                    : response.type === 'ambiguous' 
                                        ? 'AI Agent Ambiguity' 
                                        : 'AI Agent Error'}
                            </span>
                        </div>
                        <p className="response-text">{response.message}</p>
                    </div>
                )}

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