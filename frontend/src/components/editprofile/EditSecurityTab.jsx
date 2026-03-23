import { useState } from 'react';
import { Link } from 'react-router-dom';

const EyeIcon = ({ open }) => open
    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

export default function EditSecurityTab({ saving, onSubmit, inputClass }) {
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [strength, setStrength] = useState(0);

    const calcStrength = (pw) => {
        let s = 0;
        if (pw.length >= 8) s++;
        if (pw.length >= 12) s++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
        if (/\d/.test(pw)) s++;
        if (/[^a-zA-Z\d]/.test(pw)) s++;
        return Math.min(s, 4);
    };

    const strengthColor = strength === 0 ? 'bg-gray-600' : strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : 'bg-primary-500';
    const strengthText  = strength === 0 ? '' : strength <= 2 ? 'Weak' : strength === 3 ? 'Good' : 'Strong';
    const strengthTextColor = strength <= 2 ? 'text-red-400' : strength === 3 ? 'text-yellow-400' : 'text-primary-400';

    const handleChange = (e) => {
        setPasswordData(p => ({ ...p, [e.target.name]: e.target.value }));
        if (e.target.name === 'new_password') setStrength(calcStrength(e.target.value));
    };

    const handleSubmit = (e) => {
        onSubmit(e, passwordData, () => {
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setStrength(0);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Change Password</h2>

                {/* Current Password */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Current Password</label>
                    <div className="relative">
                        <input type={show.current ? 'text' : 'password'} name="current_password"
                            value={passwordData.current_password} onChange={handleChange}
                            style={{ fontSize: '16px' }} className={inputClass + ' pr-12'} required placeholder="••••••••" />
                        <button type="button" onClick={() => setShow(p => ({ ...p, current: !p.current }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                            <EyeIcon open={show.current} />
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">New Password</label>
                    <div className="relative">
                        <input type={show.new ? 'text' : 'password'} name="new_password"
                            value={passwordData.new_password} onChange={handleChange}
                            style={{ fontSize: '16px' }} className={inputClass + ' pr-12'} required minLength={6} placeholder="••••••••" />
                        <button type="button" onClick={() => setShow(p => ({ ...p, new: !p.new }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                            <EyeIcon open={show.new} />
                        </button>
                    </div>
                    {passwordData.new_password && (
                        <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-[box-shadow,border-color] duration-300 ${i < strength ? strengthColor : 'bg-gray-700'}`} />
                                ))}
                            </div>
                            {strengthText && <p className="text-xs text-[var(--text-tertiary)]">Strength: <span className={`font-medium ${strengthTextColor}`}>{strengthText}</span></p>}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirm New Password</label>
                    <div className="relative">
                        <input type={show.confirm ? 'text' : 'password'} name="confirm_password"
                            value={passwordData.confirm_password} onChange={handleChange}
                            style={{ fontSize: '16px' }}
                            className={`w-full px-4 py-3 bg-[var(--bg-tertiary)] border rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-transparent transition-[box-shadow,border-color] pr-12 ${
                                passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password
                                    ? 'border-red-500 focus:ring-red-500'
                                    : passwordData.confirm_password && passwordData.new_password === passwordData.confirm_password
                                    ? 'border-primary-500 focus:ring-primary-500'
                                    : 'border-[var(--border-color)] focus:ring-primary-500'
                            }`}
                            required placeholder="••••••••" />
                        <button type="button" onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                            <EyeIcon open={show.confirm} />
                        </button>
                    </div>
                    {passwordData.confirm_password && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${passwordData.new_password === passwordData.confirm_password ? 'text-primary-400' : 'text-red-400'}`}>
                            {passwordData.new_password === passwordData.confirm_password
                                ? <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Passwords match</>
                                : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>Passwords do not match</>
                            }
                        </p>
                    )}
                </div>

                <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors block text-center">
                    Forgot your current password?
                </Link>
            </div>

            <button type="submit" disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-[box-shadow,border-color] shadow-lg shadow-primary-500/20">
                {saving ? 'Updating…' : 'Update Password'}
            </button>
        </form>
    );
}