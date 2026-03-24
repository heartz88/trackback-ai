import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPasswordPage() {
const [email, setEmail] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [isSent, setIsSent] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async (e) => {
e.preventDefault();
setIsLoading(true);
setError('');

try {
    await api.post('/auth/forgot-password', { email });
    setIsSent(true);
} catch (err) {
    setError(err.response?.data?.error?.message || 'Failed to send reset email');
} finally {
    setIsLoading(false);
}
};

return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4">
    <div className="max-w-md w-full">
    <div className="text-center mb-8">
        <Link to="/" className="inline-block mb-8">
        <span className="text-3xl font-bold">
            <span className="text-[var(--text-primary)]">Track</span>
            <span className="text-primary-500">Back</span>
            <span className="text-[var(--text-secondary)]">AI</span>
        </span>
        </Link>
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Forgot Password?</h2>
        <p className="text-[var(--text-secondary)]">No worries, we'll send you reset instructions</p>
    </div>

    <div className="glass-panel rounded-3xl p-8">
        {isSent ? (
        <div className="text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Check Your Email</h3>
            <p className="text-[var(--text-secondary)] mb-6">
            We've sent password reset instructions to <span className="text-primary-400">{email}</span>
            </p>
            <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
            </Link>
        </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
            </div>
            )}

            <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Email Address
            </label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com"
                required
            />
            </div>

            <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 disabled:shadow-none"
            >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
                </span>
            ) : 'Send Reset Instructions'}
            </button>

            <div className="text-center">
                <p className="text-center text-[var(--text-tertiary)] text-sm animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                    Remember your password?
            <Link
                to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Sign in
            </Link>
            </p>
            </div>
        </form>
        )}
    </div>
    </div>
</div>
);
}

export default ForgotPasswordPage;