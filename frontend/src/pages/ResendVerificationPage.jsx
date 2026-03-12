import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import api from '../services/api';

function ResendVerificationPage() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/resend-verification', { email });
            setMessage('If an account exists with this email, a verification link has been sent.');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to send verification email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4 animate-fade-in">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center animate-slide-up">
                    <div className="inline-block p-4 bg-gradient-to-br rounded-2xl mb-4">
                        <img src={logo} className="w-20 h-20 object-cover rounded-xl" alt="TrackBack AI" />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                        Resend Verification Email
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        Enter your email to receive a new verification link
                    </p>
                </div>

                <form 
                    onSubmit={handleSubmit} 
                    className="glass-panel rounded-2xl p-8 space-y-6 animate-slide-up"
                    style={{ animationDelay: '0.1s' }}
                >
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}
                    
                    {message && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {message}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="you@example.com"
                            required
                            style={{ fontSize: '16px' }}
                        />
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            We'll send a new verification link to this email address.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending...
                            </span>
                        ) : (
                            'Send Verification Email'
                        )}
                    </button>

                    <div className="space-y-3 text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                ← Back to Login
                            </Link>
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Already verified?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResendVerificationPage;