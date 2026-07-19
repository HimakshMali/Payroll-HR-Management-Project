import React, { useState } from 'react';
import AxiosInstance from './AxiosInstance'; // Your configured interceptor

const AddEmployee = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'EMPLOYEE',        // will be ignored on backend
        phone_number: '',
        address: '',
        date_of_joining: '',
        pan_number: '',
        aadhaar_number: '',
        bank_account_number: '',
        base_salary: '',
        ifsc_code: ''
    });

    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});

        try {
            const response = await AxiosInstance.post('/employees/', formData);
            
            if (response.status === 201 || response.status === 200) {
                setMessage('✅ Employee profile created successfully!');
                // Reset form after success
                setFormData({
                    email: '',
                    password: '',
                    role: 'EMPLOYEE',
                    phone_number: '',
                    address: '',
                    date_of_joining: '',
                    pan_number: '',
                    aadhaar_number: '',
                    bank_account_number: '',
                    base_salary: '',
                    ifsc_code: ''
                });
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setErrors(error.response.data);
                setMessage('❌ Failed to onboard employee. Please fix the errors below.');
            } else {
                setMessage('❌ Network error – please try again.');
            }
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Onboard New Employee</h2>
            {message && <p><strong>{message}</strong></p>}

            <form onSubmit={handleSubmit}>
                {/* Email */}
                <p>
                    <label>Email Address:</label><br />
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.email && <span style={{ color: 'red' }}><br />{errors.email}</span>}
                </p>

                {/* Password */}
                <p>
                    <label>Password (min 8 chars):</label><br />
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.password && <span style={{ color: 'red' }}><br />{errors.password}</span>}
                </p>

                {/* Role – disabled or hidden, but we keep it for clarity */}
                <p>
                    <label>Role:</label><br />
                    <select name="role" value={formData.role} onChange={handleChange} disabled>
                        <option value="EMPLOYEE">Employee</option>
                    </select>
                    <small style={{ display: 'block', color: '#666' }}>Role is fixed to Employee</small>
                </p>

                {/* Phone Number (required) */}
                <p>
                    <label>Phone Number:</label><br />
                    <input 
                        type="text" 
                        name="phone_number" 
                        value={formData.phone_number} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.phone_number && <span style={{ color: 'red' }}><br />{errors.phone_number}</span>}
                </p>

                {/* Address (required) */}
                <p>
                    <label>Address:</label><br />
                    <textarea 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.address && <span style={{ color: 'red' }}><br />{errors.address}</span>}
                </p>

                {/* Date of Joining (required) */}
                <p>
                    <label>Date of Joining:</label><br />
                    <input 
                        type="date" 
                        name="date_of_joining" 
                        value={formData.date_of_joining} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.date_of_joining && <span style={{ color: 'red' }}><br />{errors.date_of_joining}</span>}
                </p>

                {/* PAN Number (required) */}
                <p>
                    <label>PAN Card Number:</label><br />
                    <input 
                        type="text" 
                        name="pan_number" 
                        value={formData.pan_number} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.pan_number && <span style={{ color: 'red' }}><br />{errors.pan_number}</span>}
                </p>

                {/* Aadhaar Number (optional – add if model has it) */}
                <p>
                    <label>Aadhaar Number:</label><br />
                    <input 
                        type="text" 
                        name="aadhaar_number" 
                        value={formData.aadhaar_number} 
                        onChange={handleChange} 
                    />
                    {errors.aadhaar_number && <span style={{ color: 'red' }}><br />{errors.aadhaar_number}</span>}
                </p>

                {/* Bank Account Number (required) */}
                <p>
                    <label>Bank Account Number:</label><br />
                    <input 
                        type="text" 
                        name="bank_account_number" 
                        value={formData.bank_account_number} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.bank_account_number && <span style={{ color: 'red' }}><br />{errors.bank_account_number}</span>}
                </p>

                {/* Base Salary (required) */}
                <p>
                    <label>Base Salary (₹):</label><br />
                    <input 
                        type="number" 
                        step="0.01" 
                        name="base_salary" 
                        value={formData.base_salary} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.base_salary && <span style={{ color: 'red' }}><br />{errors.base_salary}</span>}
                </p>

                {/* IFSC Code (required) */}
                <p>
                    <label>IFSC Code:</label><br />
                    <input 
                        type="text" 
                        name="ifsc_code" 
                        value={formData.ifsc_code} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.ifsc_code && <span style={{ color: 'red' }}><br />{errors.ifsc_code}</span>}
                </p>

                <button type="submit">Onboard Employee</button>
            </form>
        </div>
    );
};

export default AddEmployee;