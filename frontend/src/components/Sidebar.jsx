import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import '../style/sidebar.css';

const Sidebar = () => {
    const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
    const { logout } = useContext(AuthContext);

    return (
        <div className="sidebar-wrapper">
            <aside className="sidebar-modern">
                <div className="sidebar-header">
                    <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L9 9H2L7 14L5 21L12 17L19 21L17 14L22 9H15L12 2Z" />
                    </svg>
                    <h2 className="brand-logo">SALZ</h2>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="section-title">Main</span>
                        
                        <NavLink to="/agent" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </span>
                            <span className="label">Agent Dashboard</span>
                        </NavLink>

                        <button 
                            className={`nav-link dropdown-toggle ${isEmployeeOpen ? 'open' : ''}`}
                            onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
                        >
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </span>
                            <span className="label">Employee</span>
                            <span className="caret">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </span>
                        </button>
                        
                        {isEmployeeOpen && (
                            <div className="submenu">
                                <div className="submenu-item">Emp 1</div>
                                <div className="submenu-item">Emp 2</div>
                                <div className="submenu-item">Emp 3</div>
                            </div>
                        )}
                    </div>

                    <div className="nav-section">
                        <span className="section-title">Other</span>
                        
                        <div className="nav-link dummy">
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </span>
                            <span className="label">Link 1</span>
                        </div>
                        <div className="nav-link dummy">
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </span>
                            <span className="label">Link 2</span>
                        </div>
                        <div className="nav-link dummy">
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </span>
                            <span className="label">Link 3</span>
                        </div>
                    </div>

                    <div className="nav-section">
                        <span className="section-title">Account</span>
                        
                        <div className="nav-link dummy">
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </span>
                            <span className="label">Settings</span>
                        </div>
                        <div className="nav-link dummy">
                            <span className="icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </span>
                            <span className="label">About</span>
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/profile" className="user-profile-pill">
                        <img src="https://ui-avatars.com/api/?name=User&background=1a1a1a&color=fff" alt="User Avatar" className="user-avatar" />
                        <div className="user-info">
                            <span className="user-name">User Profile</span>
                            <span className="user-email">View Profile</span>
                        </div>
                        <button className="logout-icon" onClick={(e) => { e.preventDefault(); logout(); }} aria-label="Logout">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </NavLink>
                </div>
            </aside>
        </div>
    );
};

export default Sidebar;