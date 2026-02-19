import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function LoginPage() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState('');
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
try {
    const response = await api.post('/auth/login', { email, password });
    login(response.data.token, response.data.user);
    navigate('/discover');
} catch (err) {
    setError(err.response?.data?.error?.message || 'Login failed');
}
};

return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12 px-4 animate-fade-in">
    <div className="max-w-2xl w-full space-y-8 relative animate-slide-up">
    <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br rounded-2xl mb-4 animate-bounce-slow">
            <img src={logo} className="w-20 h-20 object-cover rounded-xl" alt="TrackBack AI Logo" />
        </div>
        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h2>
        <p className="text-[var(--text-secondary)]">Sign in to continue creating</p>
    </div>
    <form className="mt-8 space-y-5 glass p-8 rounded-2xl shadow-2xl" onSubmit={handleSubmit}>
        {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl animate-shake">
            {error}
        </div>
        )}
        <div className="space-y-4">
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
            />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
            <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
        </div>
        </div>
        <button
        type="submit"
        className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
        style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
        Sign in
        </button>
        <p className="text-center text-[var(--text-tertiary)] text-sm animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign up
        </Link>
        </p>
        <p className="text-center text-[var(--text-tertiary)] text-sm animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        Forgotten your password?{' '}
        <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Forgot Password
        </Link>
        </p>
    </form>
    </div>
</div>
);
}

export default LoginPage;