import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function ResetPasswordPage() {
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const token = searchParams.get('token');

const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [passwordStrength, setPasswordStrength] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
const [isSuccess, setIsSuccess] = useState(false);

const calculatePasswordStrength = (pw) => {
  let strength = 0;
  if (pw.length >= 8) strength++;
  if (pw.length >= 12) strength++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) strength++;
  if (/\d/.test(pw)) strength++;
  if (/[^a-zA-Z\d]/.test(pw)) strength++;
  return Math.min(strength, 4);
};

const getStrengthColor = () => {
  if (passwordStrength === 0) return 'bg-gray-600';
  if (passwordStrength <= 2) return 'bg-red-500';
  if (passwordStrength === 3) return 'bg-yellow-500';
  return 'bg-primary-500';
};

const getStrengthText = () => {
  if (passwordStrength === 0) return '';
  if (passwordStrength <= 2) return 'Weak';
  if (passwordStrength === 3) return 'Good';
  return 'Strong';
};

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordStrength(calculatePasswordStrength(e.target.value)); }}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                {showPassword
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? getStrengthColor() : 'bg-gray-700'}`} />
                  ))}
                </div>
                {getStrengthText() && (
                  <p className="text-xs text-[var(--text-tertiary)]">Strength: <span className={`font-medium ${passwordStrength <= 2 ? 'text-red-400' : passwordStrength === 3 ? 'text-yellow-400' : 'text-primary-400'}`}>{getStrengthText()}</span></p>
                )}
              </div>
            )}
            </div>

            <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-transparent transition-[box-shadow,border-color] pr-12 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                    ? 'border-primary-500 focus:ring-primary-500'
                    : 'border-[var(--border-color)] focus:ring-primary-500'
                }`}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                {showConfirmPassword
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${password === confirmPassword ? 'text-primary-400' : 'text-red-400'}`}>
                {password === confirmPassword
                  ? <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Passwords match</>
                  : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>Passwords do not match</>
                }
              </p>
            )}
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