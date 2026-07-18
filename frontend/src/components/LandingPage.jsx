import React from 'react';

const LandingPage = ({ onViewChange }) => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Enterprise Payroll Computational Engine</h1>
            <p>A row-level isolated HR platform designed to manage payroll, employees, and organization accounts.</p>
            <hr />
            
            <h3>Select Access Vector:</h3>
            <button type="button" onClick={() => onViewChange('login')}>
                Log In to Existing Node
            </button>
            
            <br /><br />
            
            <button type="button" onClick={() => onViewChange('register')}>
                Register New Enterprise Organization
            </button>
        </div>
    );
};

export default LandingPage;