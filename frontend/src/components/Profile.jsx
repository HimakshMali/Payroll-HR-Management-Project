import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance'; // Ensure this path is correct
import '../style/profile.css';

const Profile = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    
    // Updated to match the serializer fields
    const [editForm, setEditForm] = useState({
        role: '',
        phone_number: '',
        address: '',
        date_of_joining: '',
        pan_number: '',
        bank_account_number: '',
        base_salary: '',
        ifsc_code: ''
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/employees/');
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch employee records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleStartEdit = (employee) => {
        setEditingId(employee.id);
        setEditForm({
            role: employee.role || '',
            phone_number: employee.phone_number || '',
            address: employee.address || '',
            date_of_joining: employee.date_of_joining || '',
            pan_number: employee.pan_number || '',
            bank_account_number: employee.bank_account_number || '',
            base_salary: employee.base_salary || '',
            ifsc_code: employee.ifsc_code || ''
        });
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await axiosInstance.patch(`/employees/${id}/`, editForm);
            setEmployees(employees.map(emp => emp.id === id ? response.data : emp));
            setEditingId(null);
            setError(null);
            alert('Profile updated successfully!');
        } catch (err) {
            const serverErrors = err.response?.data;
            if (serverErrors && typeof serverErrors === 'object') {
                setError(Object.entries(serverErrors).map(([k, v]) => `${k}: ${v}`).join(' | '));
            } else {
                setError(err.response?.data?.detail || 'Authorization restriction encountered.');
            }
        }
    };

    if (loading) return <div className="loading-state">Loading organization dashboard...</div>;

    return (
        <div className="profile-dashboard">
            <div className="header-flex">
                <h2>User Profile</h2>
            </div>
            
            {error && (
                <div className="error-banner">
                    <p className="font-bold">Error Notice</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="table-container">
                <table className="corporate-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role / Phone</th>
                            <th>Banking (PAN/AC/IFSC)</th>
                            <th>Salary / DOJ</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp.id}>
                                <td>
                                    <div className="emp-name">{emp.user?.first_name} {emp.user?.last_name}</div>
                                    <div className="emp-email">{emp.user?.email}</div>
                                    {editingId === emp.id ? (
                                        <input 
                                            type="text" placeholder="Address" value={editForm.address}
                                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                            className="edit-input mt-2"
                                        />
                                    ) : (
                                        <div className="emp-subtext">{emp.address || 'No Address'}</div>
                                    )}
                                </td>
                                
                                <td>
                                    {editingId === emp.id ? (
                                        <div className="edit-stack">
                                            <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="edit-input">
                                                <option value="EMPLOYEE">EMPLOYEE</option>
                                                <option value="MANAGER">MANAGER</option>
                                                <option value="OWNER">OWNER</option>
                                            </select>
                                            <input type="text" placeholder="Phone" value={editForm.phone_number} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} className="edit-input" />
                                        </div>
                                    ) : (
                                        <>
                                            <span className={`role-badge ${emp.role?.toLowerCase()}`}>{emp.role}</span>
                                            <div className="emp-subtext mt-1">{emp.phone_number || '—'}</div>
                                        </>
                                    )}
                                </td>

                                <td>
                                    {editingId === emp.id ? (
                                        <div className="edit-stack">
                                            <input type="text" placeholder="PAN Number" value={editForm.pan_number} onChange={(e) => setEditForm({...editForm, pan_number: e.target.value})} className="edit-input" />
                                            <input type="text" placeholder="Account No." value={editForm.bank_account_number} onChange={(e) => setEditForm({...editForm, bank_account_number: e.target.value})} className="edit-input" />
                                            <input type="text" placeholder="IFSC Code" value={editForm.ifsc_code} onChange={(e) => setEditForm({...editForm, ifsc_code: e.target.value})} className="edit-input" />
                                        </div>
                                    ) : (
                                        <div className="banking-info">
                                            <div><strong>PAN:</strong> {emp.pan_number || '—'}</div>
                                            <div><strong>A/C:</strong> {emp.bank_account_number || '—'}</div>
                                            <div><strong>IFSC:</strong> {emp.ifsc_code || '—'}</div>
                                        </div>
                                    )}
                                </td>

                                <td>
                                    {editingId === emp.id ? (
                                        <div className="edit-stack">
                                            <input type="number" placeholder="Base Salary" value={editForm.base_salary} onChange={(e) => setEditForm({...editForm, base_salary: e.target.value})} className="edit-input" />
                                            <input type="date" value={editForm.date_of_joining} onChange={(e) => setEditForm({...editForm, date_of_joining: e.target.value})} className="edit-input" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="salary-text">${Number(emp.base_salary).toLocaleString()}</div>
                                            <div className="emp-subtext mt-1">Joined: {emp.date_of_joining || '—'}</div>
                                        </>
                                    )}
                                </td>

                                <td className="actions-cell">
                                    {editingId === emp.id ? (
                                        <div className="action-buttons">
                                            <button onClick={() => handleSaveEdit(emp.id)} className="btn-save">Save</button>
                                            <button onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleStartEdit(emp)} className="btn-edit">Edit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Profile;