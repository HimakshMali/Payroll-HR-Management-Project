import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import axiosInstance from './AxiosInstance';
import '../style/sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });
    const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
    const { logout, isLoggedIn, userProfile, employeeProfile } = useContext(AuthContext);

    const profile = employeeProfile;

    const displayName = profile?.first_name 
        ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
        : (userProfile?.email?.split('@')[0] || 'User');
    const displayEmail = profile?.user?.email || userProfile?.email || 'View Profile';
    const seed = profile?.first_name || userProfile?.email || 'User';
    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(seed)}`;


    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    };

    const handleDropdownClick = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setIsEmployeeOpen(true);
        } else {
            setIsEmployeeOpen(!isEmployeeOpen);
        }
    };

    const isOwner = userProfile?.role === 'OWNER';

    return (
        <div className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
            <aside className={`sidebar-modern ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Header / Logo */}
                <div className="sidebar-header">
                    <div className="brand-wrapper">
                        <div className="brand-icon-wrapper">
                            <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L9 9H2L7 14L5 21L12 17L19 21L17 14L22 9H15L12 2Z" />
                            </svg>
                        </div>
                        <h2 className="brand-logo">SALZ</h2>
                    </div>
                    <button className="collapse-btn" onClick={toggleCollapse} aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                        {isCollapsed ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        )}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    
                    {/* Section 1: Dashboard / Product */}
                    <div className="nav-section">
                        {isOwner ? (
                            <>
                                <NavLink 
                                    to="/agent" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Dashboard" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    </span>
                                    <span className="label">Dashboard</span>
                                </NavLink>

                                <NavLink 
                                    to="/org" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Organization" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Organization</span>
                                </NavLink>

                                <NavLink 
                                    to="/employees" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Employees" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Employees</span>
                                </NavLink>

                                <NavLink 
                                    to="/add-employee" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Add Employee" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Add Employee</span>
                                </NavLink>

                                <NavLink 
                                    to="/attendance" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Attendance" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="9 16 11 18 15 14"></polyline></svg>
                                    </span>
                                    <span className="label">Attendance</span>
                                </NavLink>

                                <NavLink 
                                    to="/payroll" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Monthly Payroll" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    </span>
                                    <span className="label">Monthly Payroll</span>
                                </NavLink>

                                {/* Dropdown */}
                                <button 
                                    className={`nav-link dropdown-toggle ${isEmployeeOpen && !isCollapsed ? 'open' : ''}`}
                                    onClick={handleDropdownClick}
                                    data-tooltip={isCollapsed ? "Employee" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Employee Options</span>
                                    <span className="caret">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </span>
                                </button>
                                
                                {isEmployeeOpen && !isCollapsed && (
                                    <div className="submenu">
                                        <NavLink to="/employees" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>View All</NavLink>
                                        <NavLink to="/add-employee" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>Add New</NavLink>
                                        <NavLink to="/attendance" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>Attendance Register</NavLink>
                                        <NavLink to="/payroll" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>Monthly Payroll</NavLink>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <NavLink 
                                    to="/profile" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={isCollapsed ? "Profile" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                    </span>
                                    <span className="label">My Profile</span>
                                </NavLink>

                                {profile?.id && (
                                    <NavLink 
                                        to={`/employees/${profile.id}/finance`} 
                                        className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                        data-tooltip={isCollapsed ? "Finance" : undefined}
                                    >
                                        <span className="icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                        </span>
                                        <span className="label">My Finance</span>
                                    </NavLink>
                                )}
                            </>
                        )}
                    </div>

                    {/* Section 2: Other */}
                    {isOwner && (
                        <div className="nav-section">
                            <span className="section-title">Other</span>
                            
                            <div className="nav-link dummy" data-tooltip={isCollapsed ? "Link 1" : undefined}>
                                <span className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                </span>
                                <span className="label">Link 1</span>
                                <span className="badge">2</span>
                            </div>
                            <div className="nav-link dummy" data-tooltip={isCollapsed ? "Link 2" : undefined}>
                                <span className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                </span>
                                <span className="label">Link 2</span>
                                <span className="badge">8</span>
                            </div>
                            <div className="nav-link dummy" data-tooltip={isCollapsed ? "Link 3" : undefined}>
                                <span className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                </span>
                                <span className="label">Link 3</span>
                            </div>
                        </div>
                    )}

                    {/* Section 3: Account */}
                    {isOwner && (
                        <div className="nav-section">
                            <span className="section-title">Account</span>
                            
                            <div className="nav-link dummy" data-tooltip={isCollapsed ? "Settings" : undefined}>
                                <span className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </span>
                                <span className="label">Settings</span>
                            </div>
                            <div className="nav-link dummy" data-tooltip={isCollapsed ? "About" : undefined}>
                                <span className="icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                </span>
                                <span className="label">About</span>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer Profile */}
                <div className="sidebar-footer">
                    {isCollapsed ? (
                        <div className="collapsed-footer">
                            <NavLink to="/profile" className="user-avatar-link" data-tooltip="Profile">
                                <img src={avatarUrl} alt="User Avatar" className="user-avatar" />
                            </NavLink>
                            <button className="logout-btn-collapsed" onClick={(e) => { e.preventDefault(); logout(); }} aria-label="Logout" data-tooltip="Logout">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/profile" className="profile-motion-card">
                            <div className="gradient-blob blob-1"></div>
                            <div className="gradient-blob blob-2"></div>
                            <div className="gradient-blob blob-3"></div>
                            <div className="gradient-blob blob-4"></div>
                            
                            <div className="profile-card-content">
                                <div className="profile-card-top">
                                    <img src={avatarUrl} alt="User Avatar" className="profile-card-avatar" />
                                    <button 
                                        className="profile-card-logout" 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation();
                                            logout(); 
                                        }} 
                                        aria-label="Logout"
                                        title="Logout"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="profile-card-pill">
                                    <div className="profile-card-info">
                                        <span className="profile-card-name">{displayName}</span>
                                        <span className="profile-card-email">{displayEmail}</span>
                                    </div>
                                </div>
                            </div>
                        </NavLink>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default Sidebar;