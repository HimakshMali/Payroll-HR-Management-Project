import React, { useState, useContext } from 'react';
import axiosInstance from './AxiosInstance';
import { AuthContext } from './AuthProvider';
import { useGoogleLogin } from '@react-oauth/google';
import '../style/login.css';

const Login = ({ onViewChange }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setIsLoggedIn } = useContext(AuthContext);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/login/', {
                email: email,
                password: password
            });

            if (response.status === 200) {
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
                setIsLoggedIn(true);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password credentials.');
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError('');
            setLoading(true);
            try {
                const response = await axiosInstance.post('/auth/google/', {
                    token: tokenResponse.access_token
                });

                if (response.data.status === true) {
                    localStorage.setItem('accessToken', response.data.tokens.access);
                    localStorage.setItem('refreshToken', response.data.tokens.refresh);
                    setIsLoggedIn(true);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Google login verification rejected.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Google sign-in sequence interrupted.');
            setLoading(false);
        }
    });

    return (
        <div className="page-wrapper login-page-container">
            <div className="auth-card">

                {/* LEFT SIDE: TRANSLUCENT INFORMATIONAL PANEL */}
                <div className="auth-left">
                    <div className="glass-content">
                        <h2>Automate payroll & HR operations instantly.</h2>

                        <div className="ui-mock-card">
                            <div className="mock-header">
                                <span>💸 WhatsApp Advance Log</span>
                                <span className="status-badge success">Transaction Saved</span>
                            </div>
                            <div className="mock-body">
                                <div className="metrics-row">
                                    <div className="metric-item">
                                        <span className="metric-label">Employee</span>
                                        <span className="metric-val">Rajeev Kumar</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Advance Loaded</span>
                                        <span className="metric-val">₹4,000</span>
                                    </div>
                                </div>
                                <div className="progress-bar-container">
                                    {/* Indicates deduction tracking status for upcoming cycle */}
                                    <div className="progress-bar-fill calculation-pending" style={{ width: '100%' }}></div>
                                </div>
                                <p className="mock-footer-text">🩺 Reason: Medical Expense. Auto-deducting from next salary ledger.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: TRANSLUCENT FORM PANEL */}
                <div className="auth-right">
                    {loading && (
                        <div className="form-loading-overlay">
                            <div className="spinner"></div>
                            <p>Verifying secure identity...</p>
                        </div>
                    )}

                    <div className="auth-content">
                        <h2 style={{ marginBottom: '24px', fontWeight: 600, color: '#ffffff' }}>
                            Welcome back
                        </h2>

                        {error && <div className="alert error">{error}</div>}

                        <form onSubmit={handleEmailLogin}>
                            <div className="input-field">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="input-field">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                Sign in
                            </button>
                        </form>

                        <div className="divider">
                            <span>or</span>
                        </div>

                        <div className="social-actions">
                            <button
                                type="button"
                                className="google-signin-btn"
                                onClick={() => loginWithGoogle()}
                                disabled={loading}
                            >
                                <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        <p className="login-footer">
                            Don't have an account?{' '}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onViewChange('register');
                                }}
                            >
                                Sign up
                            </a>
                        </p>
                    </div>

                    <div className="terms-text">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onViewChange('landing');
                            }}
                            className="back-home-link"
                        >
                            ← Back to homepage
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;