import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function ResetPasswordPage() {
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const token = searchParams.get('token');

const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
const [isSuccess, setIsSuccess] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();

if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
}

if (password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
}

setIsLoading(true);
setError('');

try {
    await api.post('/auth/reset-password', {
    token,
    new_password: password
    });
    setIsSuccess(true);
    setTimeout(() => {
    navigate('/login');
    }, 3000);
} catch (err) {
    setError(err.response?.data?.error?.message || 'Failed to reset password');
} finally {
    setIsLoading(false);
}
};

if (!token) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4">
    <div className="max-w-md w-full text-center">
        <div className="glass-panel rounded-3xl p-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Invalid Reset Link</h2>
        <p className="text-[var(--text-secondary)] mb-6">This password reset link is invalid or has expired.</p>
        <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Request New Link
        </Link>
        </div>
    </div>
    </div>
);
}

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
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Set New Password</h2>
        <p className="text-[var(--text-secondary)]">Enter your new password below</p>
    </div>

    <div className="glass-panel rounded-3xl p-8">
        {isSuccess ? (
        <div className="text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Password Reset Successfully!</h3>
            <p className="text-[var(--text-secondary)] mb-6">Redirecting you to login...</p>
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
                New Password
            </label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                required
                minLength={6}
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Confirm New Password
            </label>
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                required
            />
            </div>

            <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Password Requirements:</h4>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}></span>
                At least 6 characters
                </li>
                <li className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && password ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}></span>
                Passwords match
                </li>
            </ul>
            </div>

            <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none"
            >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
                </span>
            ) : 'Reset Password'}
            </button>
        </form>
        )}
    </div>
    </div>
</div>
);
}

export default ResetPasswordPage;