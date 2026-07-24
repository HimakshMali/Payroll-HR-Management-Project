import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import '../style/sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        return stored === null ? true : stored === 'true';
    });
    const [isHovered, setIsHovered] = useState(false);
    const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
    const { logout, userProfile, employeeProfile } = useContext(AuthContext);

    const profile = employeeProfile;

    const displayName = profile?.first_name 
        ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
        : (userProfile?.email?.split('@')[0] || 'User');
    const displayEmail = profile?.user?.email || userProfile?.email || 'View Profile';
    const seed = profile?.first_name || userProfile?.email || 'User';
    const avatarUrl = `https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(seed)}`;

    const toggleCollapse = (e) => {
        e.stopPropagation();
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    };

    const effectiveCollapsed = isCollapsed && !isHovered;

    const handleDropdownClick = () => {
        if (effectiveCollapsed) {
            setIsHovered(true);
            setIsEmployeeOpen(true);
        } else {
            setIsEmployeeOpen(!isEmployeeOpen);
        }
    };

    const isOwner = userProfile?.role === 'OWNER';

    return (
        <div 
            className={`sidebar-wrapper ${effectiveCollapsed ? 'collapsed' : 'expanded'} ${isHovered && isCollapsed ? 'is-hover-expanded' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsEmployeeOpen(false);
            }}
        >
            <aside className={`sidebar-modern ${effectiveCollapsed ? 'collapsed' : 'expanded'}`}>
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
                    <button className="collapse-btn" onClick={toggleCollapse} aria-label={effectiveCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                        {effectiveCollapsed ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        )}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {/* Main Navigation Section */}
                    <div className="nav-section">
                        {isOwner ? (
                            <>
                                <NavLink 
                                    to="/agent" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Dashboard" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    </span>
                                    <span className="label">Dashboard</span>
                                </NavLink>

                                <NavLink 
                                    to="/org" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Organization" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Organization</span>
                                </NavLink>

                                <NavLink 
                                    to="/employees" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Employees" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </span>
                                    <span className="label">Employees</span>
                                </NavLink>

                                <NavLink 
                                    to="/add-employee" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Add Employee" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                                    </span>
                                    <span className="label">Add Employee</span>
                                </NavLink>

                                <NavLink 
                                    to="/attendance" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Attendance" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="9 16 11 18 15 14"></polyline></svg>
                                    </span>
                                    <span className="label">Attendance</span>
                                </NavLink>

                                <NavLink 
                                    to="/payroll" 
                                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tooltip={effectiveCollapsed ? "Monthly Payroll" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    </span>
                                    <span className="label">Monthly Payroll</span>
                                </NavLink>

                                {/* Dropdown for extra employee tools */}
                                <button 
                                    className={`nav-link dropdown-toggle ${isEmployeeOpen && !effectiveCollapsed ? 'open' : ''}`}
                                    onClick={handleDropdownClick}
                                    data-tooltip={effectiveCollapsed ? "Employee Options" : undefined}
                                >
                                    <span className="icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                    </span>
                                    <span className="label">Employee Options</span>
                                    <span className="caret">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </span>
                                </button>
                                
                                {isEmployeeOpen && !effectiveCollapsed && (
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
                                    data-tooltip={effectiveCollapsed ? "Profile" : undefined}
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
                                        data-tooltip={effectiveCollapsed ? "Finance" : undefined}
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
                </nav>

                {/* Footer Profile */}
                <div className="sidebar-footer">
                    {effectiveCollapsed ? (
                        <div className="collapsed-footer">
                            <NavLink to="/profile" className="user-avatar-link" data-tooltip="Profile">
                                <img src={avatarUrl} alt="User Avatar" className="user-avatar" />
                            </NavLink>
                            <button className="logout-btn-collapsed" onClick={(e) => { e.preventDefault(); logout(); }} aria-label="Logout" data-tooltip="Logout">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/profile" className="profile-corporate-card">
                            <div className="profile-card-content">
                                <img src={avatarUrl} alt="User Avatar" className="profile-card-avatar" />
                                <div className="profile-card-info">
                                    <span className="profile-card-name">{displayName}</span>
                                    <span className="profile-card-email">{displayEmail}</span>
                                </div>
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
                        </NavLink>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default Sidebar;