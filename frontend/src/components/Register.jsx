import React, { useState } from 'react';
import axiosInstance from './AxiosInstance';
import { useGoogleLogin } from '@react-oauth/google';
import '../style/registration.css';

const Register = ({ onViewChange }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post(`/auth/register/`, {
                email: email,
                password: password,
                registration_method: 'email'
            });
            if (response.status === 201) {
                setMessage('Account credentials initialized! Redirecting to login...');
                setEmail('');
                setPassword('');
                setTimeout(() => {
                    onViewChange('login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed. Email might already exist.');
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setMessage('');
            setError('');
            setLoading(true);
            try {
                const response = await axiosInstance.post('/auth/register/google/', {
                    token: tokenResponse.access_token
                });
                if (response.data.status === true) {
                    setMessage('Organisation initialized via Google! Redirecting to login...');
                    setTimeout(() => {
                        onViewChange('login');
                    }, 2000);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Google signup failed.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Google window closed unexpectedly.');
            setLoading(false);
        }
    });

    return (
        <div className="page-wrapper">
            <div className="auth-card">

                {/* LEFT SIDE: FORM PANEL */}
                <div className="auth-left">
                    {loading && (
                        <div className="form-loading-overlay">
                            <div className="spinner"></div>
                            <p>Initializing secure tenant node...</p>
                        </div>
                    )}

                    <div className="auth-content">
                        {message && <div className="alert success">{message}</div>}
                        {error && <div className="alert error">{error}</div>}

                        <form onSubmit={handleEmailSignup}>
                            <div className="input-field">
                                <label>Email</label>
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
                                    placeholder="Create a password"
                                />
                                <div className="password-hints">
                                    <span>○ Must be at least 8 characters</span>
                                    <span>○ Must contain one special character</span>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                Create account
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
                                Sign up with Google
                            </button>
                        </div>

                        <p className="login-footer">
                            Already have an account?{' '}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onViewChange('login');
                                }}
                            >
                                Log in
                            </a>
                        </p>
                    </div>

                    <div className="terms-text">
                        By creating an account, you agree to our terms of use.
                    </div>
                </div>

                {/* RIGHT SIDE: ILLUSION BOX (EXPOSING WRAPPER IMAGE) */}
                <div className="auth-right">
                    <div className="glass-content">
                        <h2>Automate payroll & HR operations instantly.</h2>

                        <div className="ui-mock-card">
                            <div className="mock-header">
                                <span>💬 WhatsApp Agent Activity</span>
                                <span className="status-dot"></span>
                            </div>
                            <div className="mock-body">
                                <p class="msg outgoing">"4000 rs given advance to rajeev for his medical expense"</p>
                                <p class="msg incoming">⚡ Transaction saved: 4000 Rs advance loaded for Rajeev.</p>

                                <p class="msg outgoing">"Show his remaining balance status."</p>
                                <p class="msg incoming">📊 Outstanding Advance Pool: 4000 Rs. Will be deducted from next salary cycle.</p>

                                <p class="msg outgoing">"Confirm calculation ledger update."</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Register;