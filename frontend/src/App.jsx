// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'
// import LandingPage from './components/LandingPage'
// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <LandingPage />
//     </>
//   )
// }

// export default App

import React, { useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import OrganizationProfile from './components/OrganizationProfile';
import { AuthContext } from './components/AuthProvider';
import AddEmployee from './components/AddEmployee'; 
import Employees from './components/Employees';
import EmployeeDetailView from './components/EmployeeDetailView'; 
import EmployeeFinance from './components/EmployeeFinance';
import AttendancePage from './components/AttendancePage';
import EmployeeAttendance from './components/EmployeeAttendance';
import MonthlySalary from './components/MonthlySalary';
import PayslipPreview from './components/PayslipPreview';
import './style/layout.css';

function App() {
    const { isLoggedIn, userProfile, employeeProfile, loadingProfile } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleViewChange = (view) => {
        if (view === 'login') {
            navigate('/login');
        } else if (view === 'register') {
            navigate('/register');
        } else {
            navigate('/');
        }
    };

    if (isLoggedIn) {
        if (loadingProfile) {
            return (
                <div className="modern-loading-zone">
                    <div className="ui-pulse-loader"></div>
                    <p>Loading application...</p>
                </div>
            );
        }

        const isOwner = userProfile?.role === 'OWNER';

        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        {isOwner ? (
                            <>
                                <Route path="/agent" element={<Home />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/employees" element={<Employees />} />
                                <Route path="/employees/:id" element={<EmployeeDetailView />} />
                                <Route path="/employees/:id/finance" element={<EmployeeFinance />} />
                                <Route path="/attendance" element={<AttendancePage />} />
                                <Route path="/employees/:id/attendance" element={<EmployeeAttendance />} />
                                <Route path="/payroll" element={<MonthlySalary />} />
                                <Route path="/payroll/print/:salaryRecordId" element={<PayslipPreview />} />
                                <Route path="/employees/:id/payroll" element={<MonthlySalary />} />
                                <Route path="/org" element={<OrganizationProfile />} />
                                <Route path="/add-employee" element={<AddEmployee />} />
                                <Route path="*" element={<Navigate to="/agent" replace />} />
                            </>
                        ) : (
                            <>
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/employees/:id/finance" element={<EmployeeFinance />} />
                                <Route path="/attendance" element={<AttendancePage />} />
                                <Route path="/employees/:id/attendance" element={<EmployeeAttendance />} />
                                <Route path="/payroll" element={<MonthlySalary />} />
                                <Route path="/payroll/print/:salaryRecordId" element={<PayslipPreview />} />
                                <Route path="/employees/:id/payroll" element={<MonthlySalary />} />
                                <Route path="*" element={<Navigate to="/profile" replace />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage onViewChange={handleViewChange} />} />
            <Route path="/login" element={<Login onViewChange={handleViewChange} />} />
            <Route path="/register" element={<Register onViewChange={handleViewChange} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;