import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function RegisterPage() {
const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [error, setError] = useState('');
const [passwordStrength, setPasswordStrength] = useState(0);
const { login } = useAuth();
const navigate = useNavigate();

const calculatePasswordStrength = (password) => {
let strength = 0;
if (password.length >= 8) strength++;
if (password.length >= 12) strength++;
if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
if (/\d/.test(password)) strength++;
if (/[^a-zA-Z\d]/.test(password)) strength++;
return Math.min(strength, 4);
};

const handlePasswordChange = (password) => {
setFormData({ ...formData, password });
setPasswordStrength(calculatePasswordStrength(password));
};

const handleSubmit = async (e) => {
e.preventDefault();

if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
}

if (formData.password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
}

try {
    const { confirmPassword, ...submitData } = formData;
    const response = await api.post('/auth/register', submitData);
    login(response.data.token, response.data.user);
    navigate('/discover');
} catch (err) {
    setError(err.response?.data?.error?.message || 'Registration failed');
}
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

return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4 animate-fade-in">
    <div className="max-w-md w-full space-y-8 relative animate-slide-up">
    <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 animate-bounce-slow">
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
        </div>
        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Create account</h2>
        <p className="text-[var(--text-secondary)]">Start collaborating on tracks</p>
    </div>
    <form className="mt-8 space-y-5 glass p-8 rounded-2xl shadow-2xl" onSubmit={handleSubmit}>
        {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl animate-shake">
            {error}
        </div>
        )}
        <div className="space-y-4">
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Username</label>
            <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Choose a username"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
            />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
            <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
            />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
            <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
                {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                )}
            </button>
            </div>
            {formData.password && (
            <div className="mt-2">
                <div className="flex gap-1 mb-1">
                {[...Array(4)].map((_, i) => (
                    <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? getStrengthColor() : 'bg-gray-700'
                        }`}
                    />
                ))}
                </div>
                {getStrengthText() && (
                <p className="text-xs text-[var(--text-tertiary)]">
                    Password strength: <span className={`font-medium ${passwordStrength <= 2 ? 'text-red-400' : passwordStrength === 3 ? 'text-yellow-400' : 'text-primary-400'
                    }`}>{getStrengthText()}</span>
                </p>
                )}
            </div>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Minimum 6 characters</p>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirm Password</label>
            <div className="relative">
            <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-primary-500 focus:ring-primary-500'
                    : 'border-[var(--border-color)] focus:ring-primary-500'
                }`}
                required
            />
            <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
                {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                )}
            </button>
            </div>
            {formData.confirmPassword && (
            <p className={`text-xs mt-1 transition-all ${formData.password === formData.confirmPassword ? 'text-primary-400' : 'text-red-400'
                }`}>
                {formData.password === formData.confirmPassword ? (
                <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Passwords match
                </span>
                ) : (
                <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Passwords do not match
                </span>
                )}
            </p>
            )}
        </div>
        </div>
        <button
        type="submit"
        className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
        Create account
        </button>
        <p className="text-center text-[var(--text-tertiary)] text-sm animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
        </Link>
        </p>
    </form>
    {/* Tips */}
    <div className="mt-6 glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        Profile Tips
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
        <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Choose a unique username that represents your music identity</span>
        </li>
        <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Write a bio that highlights your music style and what you're looking for</span>
        </li>
        <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>List your skills to help others find you for collaborations</span>
        </li>
        </ul>
    </div>
    </div>
</div>
);
}

export default RegisterPage;