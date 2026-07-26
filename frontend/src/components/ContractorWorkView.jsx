import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import '../style/contractors.css';

const MILESTONE_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DELAYED', label: 'Delayed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const ContractorWorkView = () => {
    const { workId } = useParams();
    const navigate = useNavigate();

    const [work, setWork] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add/Edit milestone
    const [showModal, setShowModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState(null);

    const [milestoneForm, setMilestoneForm] = useState({
        title: '',
        description: '',
        status: 'PENDING',
        due_date: '',
        completed_at: '',
        amount: '0.00'
    });

    useEffect(() => {
        if (workId) {
            fetchWorkData();
        }
    }, [workId]);

    const fetchWorkData = async () => {
        setLoading(true);
        try {
            const [wRes, mRes] = await Promise.all([
                axiosInstance.get(`../contractors/work/${workId}/`),
                axiosInstance.get(`../contractors/milestones/?work=${workId}`)
            ]);
            setWork(wRes.data);
            setMilestones(mRes.data || []);
        } catch (err) {
            console.error('Error fetching work timeline:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAddMilestoneModal = () => {
        setEditingMilestone(null);
        setMilestoneForm({
            title: '',
            description: '',
            status: 'PENDING',
            due_date: '',
            completed_at: '',
            amount: '0.00'
        });
        setModalError(null);
        setShowModal(true);
    };

    const openEditMilestoneModal = (m) => {
        setEditingMilestone(m);
        setMilestoneForm({
            title: m.title || '',
            description: m.description || '',
            status: m.status || 'PENDING',
            due_date: m.due_date || '',
            completed_at: m.completed_at || '',
            amount: m.amount || '0.00'
        });
        setModalError(null);
        setShowModal(true);
    };

    const handleMilestoneFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setModalError(null);

        const payload = {
            ...milestoneForm,
            work: parseInt(workId)
        };

        try {
            if (editingMilestone) {
                await axiosInstance.put(`../contractors/milestones/${editingMilestone.id}/`, payload);
            } else {
                await axiosInstance.post(`../contractors/milestones/`, payload);
            }
            await fetchWorkData();
            setShowModal(false);
        } catch (err) {
            setModalError('Error saving milestone item.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWorkStatusChange = async (newStatus) => {
        try {
            await axiosInstance.patch(`../contractors/work/${workId}/`, { work_status: newStatus });
            setWork(prev => ({ ...prev, work_status: newStatus }));
        } catch (err) {
            console.error('Error updating work status:', err);
        }
    };

    if (loading) {
        return (
            <div className="contractors-container" style={{ textAlign: 'center', padding: '4rem' }}>
                <p style={{ color: '#64748B' }}>Loading work details and milestone timeline...</p>
            </div>
        );
    }

    if (!work) {
        return (
            <div className="contractors-container" style={{ textAlign: 'center', padding: '4rem' }}>
                <h3>Work Assignment not found</h3>
                <Link to="/contractors" className="btn-action-sm" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    ← Back to Contractors Directory
                </Link>
            </div>
        );
    }

    // Timeline statistics
    const completedCount = milestones.filter(m => m.status === 'COMPLETED').length;
    const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

    return (
        <div className="contractors-container">
            {/* Header */}
            <header className="ctr-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/contractors" className="btn-action-sm">
                        ← Back
                    </Link>
                    <div className="ctr-title-group">
                        <h1>
                            {work.work_description || 'Work Assignment'}
                            <span className={`status-pill ${work.work_status}`}>
                                {work.work_status}
                            </span>
                        </h1>
                        <p>Contractor: <strong>{work.contractor_name}</strong> | Type: <strong>{work.work_type}</strong></p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Work Status:</label>
                    <select 
                        className="ms-select-box"
                        value={work.work_status}
                        onChange={(e) => handleWorkStatusChange(e.target.value)}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </header>

            {/* Financial Breakdown Grid */}
            <div className="ctr-stats-grid">
                <div className="ctr-stat-card dark-emerald">
                    <div className="ctr-stat-label">Total Net Payable</div>
                    <div className="ctr-stat-value">₹{parseFloat(work.total_payment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="ctr-stat-sub">Includes misc charges & tax deductions</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Gross Billed</div>
                    <div className="ctr-stat-value">₹{parseFloat(work.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="ctr-stat-sub" style={{ color: '#64748B' }}>Rate: ₹{work.rate} × {work.units_worked} units</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">TDS Tax Deduction</div>
                    <div className="ctr-stat-value" style={{ color: '#6366F1' }}>
                        ₹{parseFloat(work.tds_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="ctr-stat-sub" style={{ color: '#6366F1' }}>TDS Rate: {work.tds_percentage}%</div>
                </div>

                <div className="ctr-stat-card">
                    <div className="ctr-stat-label">Timeline Completion</div>
                    <div className="ctr-stat-value" style={{ color: '#059669' }}>{progressPct}%</div>
                    <div className="ctr-stat-sub" style={{ color: '#059669' }}>{completedCount} of {milestones.length} Milestones Done</div>
                </div>
            </div>

            {/* Timeline Progress Bar */}
            <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>Work Progress & Milestones</span>
                    <span>{progressPct}% Complete</span>
                </div>
                <div style={{ background: '#E2E8F0', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #059669, #10B981)', height: '100%', width: `${progressPct}%`, transition: 'width 0.3s ease' }}></div>
                </div>
            </div>

            {/* Interactive Timeline View */}
            <div className="timeline-card">
                <div className="timeline-header">
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                            Deliverable Timeline & Milestones
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                            Track project milestones, due dates, and completion status.
                        </p>
                    </div>
                    <button className="btn-primary-sm" onClick={openAddMilestoneModal}>
                        + Add Milestone
                    </button>
                </div>

                {milestones.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                        <p style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>No milestones added to this timeline yet.</p>
                        <button className="btn-primary-sm" onClick={openAddMilestoneModal}>
                            + Create First Milestone
                        </button>
                    </div>
                ) : (
                    <div className="timeline-list">
                        {milestones.map((m, idx) => (
                            <div key={m.id} className={`timeline-item ${m.status}`}>
                                <div className="timeline-icon-dot">
                                    {m.status === 'COMPLETED' ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{idx + 1}</span>
                                    )}
                                </div>

                                <div className="timeline-content-card">
                                    <div className="timeline-item-title">
                                        <h4>{m.title}</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span className={`status-pill ${m.status}`}>
                                                {m.status}
                                            </span>
                                            <button 
                                                className="btn-action-sm" 
                                                onClick={() => openEditMilestoneModal(m)}
                                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>

                                    {m.description && (
                                        <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0.35rem 0 0.6rem 0' }}>
                                            {m.description}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {m.due_date && <span>📅 Due: <strong>{m.due_date}</strong></span>}
                                        {m.completed_at && <span>✅ Completed: <strong>{m.completed_at}</strong></span>}
                                        {parseFloat(m.amount) > 0 && <span>💰 Milestone Value: <strong>₹{m.amount}</strong></span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ADD / EDIT MILESTONE MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingMilestone ? 'Edit Timeline Milestone' : 'Add Milestone to Timeline'}</h3>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleMilestoneFormSubmit}>
                            <div className="modal-body">
                                {modalError && <div style={{ color: '#DC2626', marginBottom: '1rem', fontSize: '0.85rem' }}>{modalError}</div>}
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Milestone Title *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            required 
                                            placeholder="e.g. Prototype Wireframes Approval"
                                            value={milestoneForm.title} 
                                            onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} 
                                        />
                                    </div>

                                    <div className="form-group full">
                                        <label>Description</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3"
                                            placeholder="Details or deliverables required..."
                                            value={milestoneForm.description} 
                                            onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})} 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Status</label>
                                        <select 
                                            className="form-control" 
                                            value={milestoneForm.status} 
                                            onChange={e => setMilestoneForm({...milestoneForm, status: e.target.value})}
                                        >
                                            {MILESTONE_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Milestone Value (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control" 
                                            value={milestoneForm.amount} 
                                            onChange={e => setMilestoneForm({...milestoneForm, amount: e.target.value})} 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Due Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={milestoneForm.due_date} 
                                            onChange={e => setMilestoneForm({...milestoneForm, due_date: e.target.value})} 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Completed Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={milestoneForm.completed_at} 
                                            onChange={e => setMilestoneForm({...milestoneForm, completed_at: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {editingMilestone ? 'Update Milestone' : 'Save Milestone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorWorkView;
