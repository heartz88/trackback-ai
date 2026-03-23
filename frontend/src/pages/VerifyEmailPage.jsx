import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';
import api from '../services/api';

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message);
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error?.message || 'Verification failed');
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4 animate-fade-in">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center animate-slide-up">
                    <div className="inline-block p-4 bg-gradient-to-br rounded-2xl mb-4">
                        <img src={logo} className="w-20 h-20 object-cover rounded-xl" alt="TrackBack AI" />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                        Email Verification
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        {status === 'verifying' && 'Please wait while we verify your email...'}
                        {status === 'success' && 'Your email has been verified!'}
                        {status === 'error' && 'Verification failed'}
                    </p>
                </div>

                <div className="glass-panel rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {status === 'verifying' && (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-[var(--text-secondary)]">
                                Verifying your email address...
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-green-500 mb-2">Success!</h3>
                                <p className="text-[var(--text-secondary)]">{message}</p>
                                <p className="text-sm text-[var(--text-tertiary)] mt-4">
                                    Redirecting to login in 3 seconds...
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-[box-shadow,border-color]"
                                >
                                    Go to Login Now
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-red-500 mb-2">Verification Failed</h3>
                                <p className="text-[var(--text-secondary)]">{message}</p>
                            </div>
                            <div className="pt-4 space-y-3">
                                <Link
                                    to="/login"
                                    className="block w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-[box-shadow,border-color]"
                                >
                                    Go to Login
                                </Link>
                                <Link
                                    to="/resend-verification"
                                    className="block text-sm text-primary-400 hover:text-primary-300 transition-colors"
                                >
                                    Resend verification email
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmailPage;