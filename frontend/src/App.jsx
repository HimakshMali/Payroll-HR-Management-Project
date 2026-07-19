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
import './style/layout.css';

function App() {
    const { isLoggedIn } = useContext(AuthContext);
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
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/agent" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/org" element={<OrganizationProfile />} />
                        <Route path="/add-employee" element={<AddEmployee />} />
                        <Route path="*" element={<Navigate to="/agent" replace />} />
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