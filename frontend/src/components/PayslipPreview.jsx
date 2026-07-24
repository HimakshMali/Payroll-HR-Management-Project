import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from './AxiosInstance';
import '../style/payslippreview.css';

const TEMPLATE_OPTIONS = [
    { id: 'minimal-corporate', name: 'Minimal Corporate Template', description: 'Clean executive lines with crisp financial breakdown' }
];

const PayslipPreview = () => {
    const { salaryRecordId } = useParams();
    const navigate = useNavigate();
    const iframeRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState('minimal-corporate');
    const [recordData, setRecordData] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Salary Record details
    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const res = await axiosInstance.get(`../payroll/salary-records/${salaryRecordId}/`);
                setRecordData(res.data);
            } catch (err) {
                console.error("Error fetching salary record:", err);
            }
        };
        if (salaryRecordId) {
            fetchRecord();
        }
    }, [salaryRecordId]);

    // 2. Fetch PDF Blob Stream via AxiosInstance (includes Authorization Bearer Token)
    useEffect(() => {
        let currentBlobUrl = null;
        const fetchPdfStream = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axiosInstance.get(`../payroll/salary-records/${salaryRecordId}/pdf-stream/?template=${selectedTemplate}`, {
                    responseType: 'blob'
                });

                const blob = new Blob([res.data], { type: 'application/pdf' });
                currentBlobUrl = window.URL.createObjectURL(blob);
                setPdfBlobUrl(currentBlobUrl);
            } catch (err) {
                console.error("Error fetching PDF stream:", err);
                setError(err.response?.data?.detail || "Failed to load PDF preview statement.");
            } finally {
                setLoading(false);
            }
        };

        if (salaryRecordId) {
            fetchPdfStream();
        }

        return () => {
            if (currentBlobUrl) {
                window.URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [salaryRecordId, selectedTemplate]);

    // Handlers
    const handleDownloadPDF = () => {
        if (!pdfBlobUrl) return;
        const link = document.createElement('a');
        link.href = pdfBlobUrl;
        const empName = recordData?.employee_name?.split('@')[0] || 'Employee';
        const filename = `Payslip_${empName}_${recordData?.month || 'Period'}_${recordData?.year || '2026'}.pdf`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };

    const handlePrintPDF = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.focus();
            iframeRef.current.contentWindow.print();
        }
    };

    return (
        <div className="payslip-preview-container">
            {/* Header Controls Bar */}
            <div className="preview-header-bar">
                <div className="bar-left">
                    <button onClick={() => navigate('/payroll')} className="btn-back-payroll">
                        ← Back to Payroll Manager
                    </button>
                    <div className="preview-title-group">
                        <h2>Payslip Template Preview</h2>
                        {recordData && (
                            <span className="preview-subtitle">
                                {recordData.employee_name} • Month {recordData.month}, {recordData.year}
                            </span>
                        )}
                    </div>
                </div>

                <div className="bar-right-actions">
                    <button 
                        className="btn-preview-action btn-download"
                        onClick={handleDownloadPDF}
                        disabled={loading || !pdfBlobUrl}
                    >
                        📥 Download PDF
                    </button>

                    <button 
                        className="btn-preview-action btn-print-pdf"
                        onClick={handlePrintPDF}
                        disabled={loading || !pdfBlobUrl}
                    >
                        🖨 Print PDF
                    </button>
                </div>
            </div>

            {/* Main Grid: Sidebar Selector + Live PDF Viewer */}
            <div className="preview-main-grid">
                
                {/* Left Sidebar Template Selector */}
                <div className="template-sidebar">
                    <h3 className="sidebar-section-title">Select Template</h3>
                    <p className="sidebar-desc">Choose a design layout to preview & generate the payslip.</p>

                    <div className="templates-list">
                        {TEMPLATE_OPTIONS.map(tmpl => (
                            <div 
                                key={tmpl.id}
                                className={`template-option-card ${selectedTemplate === tmpl.id ? 'active' : ''}`}
                                onClick={() => setSelectedTemplate(tmpl.id)}
                            >
                                <div className="tmpl-card-top">
                                    <span className="tmpl-name">{tmpl.name}</span>
                                    {selectedTemplate === tmpl.id && <span className="tmpl-active-badge">✓ Active</span>}
                                </div>
                                <p className="tmpl-desc">{tmpl.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Area: PDF Viewer */}
                <div className="pdf-viewer-area">
                    {loading ? (
                        <div className="viewer-loading-state">
                            <div className="preview-pulse-loader"></div>
                            <p>Generating payslip PDF statement...</p>
                        </div>
                    ) : error ? (
                        <div className="viewer-error-state">
                            <h3>⚠️ Error Loading Statement</h3>
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="btn-retry-preview">Retry</button>
                        </div>
                    ) : (
                        <div className="iframe-wrapper">
                            <iframe 
                                ref={iframeRef}
                                src={pdfBlobUrl}
                                title="Payslip Live Preview"
                                className="pdf-iframe"
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PayslipPreview;
