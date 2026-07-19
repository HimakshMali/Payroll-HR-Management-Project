import React, { useState, useContext, createContext, useEffect } from 'react';
import axiosInstance from './AxiosInstance';

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

const getInitialProfile = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
            return {
                userId: decoded.user_id,
                email: decoded.email,
                tenantId: decoded.tenant_id,
                role: decoded.role,
                isHr: decoded.is_hr,
                organizationName: decoded.organization_name || "Active Tenant Organization"
            };
        }
    }
    return null;
};

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
    const [userProfile, setUserProfile] = useState(getInitialProfile);
    const [employeeProfile, setEmployeeProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('accessToken');
        if (token) {
            const decoded = decodeJwt(token);
            if (decoded) {
                setUserProfile({
                    userId: decoded.user_id,
                    email: decoded.email,
                    tenantId: decoded.tenant_id,
                    role: decoded.role,
                    isHr: decoded.is_hr,
                    organizationName: decoded.organization_name || "Active Tenant Organization"
                });
                setIsLoggedIn(true);

                // Fetch full employee profile
                setLoadingProfile(true);
                axiosInstance.get('/employees/me/')
                    .then(response => {
                        if (isMounted) {
                            setEmployeeProfile(response.data);
                            setLoadingProfile(false);
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching employee profile in AuthProvider:", err);
                        if (isMounted) {
                            setLoadingProfile(false);
                        }
                    });
            } else {
                logout();
            }
        } else {
            setUserProfile(null);
            setEmployeeProfile(null);
            setIsLoggedIn(false);
            setLoadingProfile(false);
        }
        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUserProfile(null);
        setEmployeeProfile(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userProfile, employeeProfile, loadingProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
export { AuthContext };