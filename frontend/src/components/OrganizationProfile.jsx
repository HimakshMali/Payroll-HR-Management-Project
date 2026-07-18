import React, { useState, useEffect } from 'react';
import axiosInstance from './AxiosInstance';

const OrganizationProfile = () => {
    // Expecting a single object now, so initialize as null
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrganization = async () => {
    try {
        setLoading(true);
        
        const response = await axiosInstance.get("organization/"); 
        console.log("Fetched Profile Data:", response.data);
        
        setOrganization(response.data);
    } catch (error) {
        console.error("Error fetching organization:", error);
        setError("Failed to load your organization profile.");
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchOrganization();
    }, []);

    if (loading) return <div>Loading organization profile...</div>;
    if (error) return <div>{error}</div>;
    if (!organization) return <div>No organization profile found.</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Organization Profile</h2>
            <hr />
            
            <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '600px' }}>
                <tbody>
                    <tr>
                        <td><strong>Name</strong></td>
                        <td>{organization.org_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Description</strong></td>
                        <td>{organization.org_desc || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Phone Number</strong></td>
                        <td>{organization.org_phone_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Address</strong></td>
                        <td>{organization.org_address || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>PAN Number</strong></td>
                        <td>{organization.org_pan_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Bank Account Number</strong></td>
                        <td>{organization.org_bank_account_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>IFSC Code</strong></td>
                        <td>{organization.org_ifsc_code || 'N/A'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default OrganizationProfile;