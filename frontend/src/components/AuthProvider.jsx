import React, { useState, useContext, createContext, useEffect } from 'react';

const AuthContext = createContext();

const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const decoded = decodeJwt(token);
            if (decoded) {
                setUserProfile({
                    email: decoded.email,
                    tenantId: decoded.tenant_id,
                    role: decoded.role,
                    isHr: decoded.is_hr,
                    // If your backend injects organisation details or profile links, we capture it here:
                    organizationName: decoded.organization_name || "Active Tenant Organization"
                });
                setIsLoggedIn(true);
            } else {
                logout();
            }
        } else {
            setUserProfile(null);
            setIsLoggedIn(false);
        }
    }, [isLoggedIn]);

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUserProfile(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
export { AuthContext };