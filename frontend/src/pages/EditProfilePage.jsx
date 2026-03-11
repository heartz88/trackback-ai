import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmailNotificationSettings from '../components/common/EmailNotificationSettings';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function EditProfilePage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const avatarInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '', email: '', bio: '', skills: '',
        looking_for_collab: true, preferred_genres: '', equipment: '',
    });

    const [socialLinks, setSocialLinks] = useState({
        instagram: '', twitter: '', soundcloud: '',
        spotify: '', youtube: '', tiktok: '', discord: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '', new_password: '', confirm_password: ''
    });

    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/${user.id}`);
                const profile = response.data.user;
                setFormData({
                    username: profile.username || '',
                    email: profile.email || '',
                    bio: profile.bio || '',
                    skills: profile.skills ? profile.skills.join(', ') : '',
                    looking_for_collab: profile.looking_for_collab !== false,
                    preferred_genres: profile.preferred_genres ? profile.preferred_genres.join(', ') : '',
                    equipment: profile.equipment ? profile.equipment.join(', ') : '',
                });
                if (profile.social_links) setSocialLinks({ instagram: '', twitter: '', soundcloud: '', spotify: '', youtube: '', tiktok: '', discord: '', ...profile.social_links });
                setAvatarUrl(profile.avatar_url || '');
            } catch { setError('Failed to load profile'); }
            finally { setLoading(false); }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSocialChange = (e) => setSocialLinks(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
        setAvatarUrl(URL.createObjectURL(file));
        setUploadingAvatar(true); setError('');
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const res = await api.post(`/users/${user.id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAvatarUrl(res.data.avatar_url);
            login(localStorage.getItem('token'), { ...user, avatar_url: res.data.avatar_url });
            setSuccess('Profile picture updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to upload image');
            setAvatarUrl('');
        } finally { setUploadingAvatar(false); }
    };

    const handleRemoveAvatar = async () => {
        setUploadingAvatar(true); setError('');
        try {
            await api.delete(`/users/${user.id}/avatar`);
            setAvatarUrl('');
            login(localStorage.getItem('token'), { ...user, avatar_url: null });
            setSuccess('Profile picture removed');
            setTimeout(() => setSuccess(''), 3000);
        } catch { setError('Failed to remove profile picture'); }
        finally { setUploadingAvatar(false); }
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSaving(true);
        try {
            const response = await api.put(`/users/${user.id}`, {
                username: formData.username, email: formData.email,
                bio: formData.bio,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                looking_for_collab: formData.looking_for_collab,
                preferred_genres: formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean),
                equipment: formData.equipment.split(',').map(s => s.trim()).filter(Boolean),
                social_links: socialLinks
            });
            login(localStorage.getItem('token'), response.data.user);
            setSuccess('Profile updated!');
            setTimeout(() => navigate(`/profile/${formData.username}`), 1500);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to update profile');
        } finally { setSaving(false); }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (passwordData.new_password !== passwordData.confirm_password) { setError('New passwords do not match'); return; }
        if (passwordData.new_password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setSaving(true);
        try {
            await api.put(`/users/${user.id}/password`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setSuccess('Password updated!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to update password');
        } finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";

    const tabs = [
        { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: '👤' },
        { id: 'details', label: 'Music', shortLabel: 'Music', icon: '🎵' },
        { id: 'social', label: 'Social', shortLabel: 'Social', icon: '🔗' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Notifs', icon: '🔔' },
        { id: 'security', label: 'Security', shortLabel: 'Security', icon: '🔒' },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="music-loader">{[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar" />)}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-4 sm:py-8 px-3 sm:px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-5 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">Edit Profile</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Customize your profile and connect with other artists</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {success}
                    </div>
                )}

                {/* Tabs — scrollable on mobile */}
                <div className="flex gap-1 mb-5 border-b border-[var(--border-color)] pb-0 overflow-x-auto scrollbar-none">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl font-medium transition-all whitespace-nowrap text-sm border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                            }`}>
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* ── Profile Info Tab ── */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8 space-y-5">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Basic Information</h2>

                        {/* Avatar Upload */}
                        <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)]/40 rounded-2xl border border-[var(--border-color)]">
                            <div className="relative flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-primary-500/30" onError={() => setAvatarUrl('')} />
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-primary-500/30">
                                        {formData.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">Profile Picture</p>
                                <p className="text-xs text-[var(--text-tertiary)] mb-3">JPEG, PNG, WebP — max 5MB</p>
                                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-all">
                                        {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                                    </button>
                                    {avatarUrl && (
                                        <button type="button" onClick={handleRemoveAvatar} disabled={uploadingAvatar}
                                            className="px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 text-xs font-semibold rounded-lg transition-all border border-[var(--border-color)] disabled:opacity-50">
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Username + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Username <span className="text-red-400">*</span></label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange}
                                    className={inputClass} style={{ fontSize: '16px' }} required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Email <span className="text-red-400">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    className={inputClass} style={{ fontSize: '16px' }} required />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4"
                                className={inputClass + " resize-none"} style={{ fontSize: '16px' }}
                                placeholder="Tell others about yourself, your music style, what you're working on..." />
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">A brief description about yourself and your music</p>
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Skills</label>
                            <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                                className={inputClass} style={{ fontSize: '16px' }}
                                placeholder="mixing, mastering, vocals, guitar, production" />
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate multiple skills with commas</p>
                        </div>

                        {/* Collab toggle */}
                        <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                            <input type="checkbox" id="looking_for_collab" checked={formData.looking_for_collab}
                                onChange={(e) => setFormData(prev => ({ ...prev, looking_for_collab: e.target.checked }))}
                                className="w-5 h-5 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-primary-600 focus:ring-primary-500" />
                            <label htmlFor="looking_for_collab" className="text-sm text-[var(--text-primary)] font-medium">Available for collaborations</label>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link to={`/profile/${formData.username}`}
                                className="py-3 px-6 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-xl transition-all border border-[var(--border-color)] text-center text-sm">
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}

                {/* ── Music Details Tab ── */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8 space-y-5">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Music Details</h2>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Preferred Genres</label>
                            <input type="text" name="preferred_genres" value={formData.preferred_genres} onChange={handleChange}
                                className={inputClass} style={{ fontSize: '16px' }}
                                placeholder="Electronic, Hip-Hop, Rock, Jazz" />
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate with commas</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Equipment / Software</label>
                            <input type="text" name="equipment" value={formData.equipment} onChange={handleChange}
                                className={inputClass} style={{ fontSize: '16px' }}
                                placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone" />
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">What DAW do you use? Separate with commas</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all">
                                {saving ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Social Links Tab ── */}
                {activeTab === 'social' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8 space-y-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1">Social Links</h2>
                            <p className="text-sm text-[var(--text-secondary)]">Connect your social media profiles</p>
                        </div>

                        {/* @ prefix platforms */}
                        {[
                            { name: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/instagram' },
                            { name: 'twitter', label: 'Twitter / X', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/x' },
                            { name: 'tiktok', label: 'TikTok', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/tiktok' },
                        ].map(({ name, label, prefix, placeholder, icon }) => (
                            <div key={name}>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src={icon} className="w-4 h-4" alt={label} />{label}
                                </label>
                                <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                                    <span className="px-3 py-3 text-[var(--text-tertiary)] text-sm border-r border-[var(--border-color)] bg-[var(--bg-tertiary)] select-none">{prefix}</span>
                                    <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                        className="flex-1 px-3 py-3 bg-transparent text-[var(--text-primary)] focus:outline-none text-sm"
                                        style={{ fontSize: '16px' }} placeholder={placeholder} />
                                </div>
                            </div>
                        ))}

                        {/* URL platforms */}
                        {[
                            { name: 'soundcloud', label: 'SoundCloud', placeholder: 'soundcloud.com/username', icon: 'https://cdn.simpleicons.org/soundcloud' },
                            { name: 'spotify', label: 'Spotify', placeholder: 'open.spotify.com/artist/...', icon: 'https://cdn.simpleicons.org/spotify' },
                            { name: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/username', icon: 'https://cdn.simpleicons.org/youtube' },
                            { name: 'discord', label: 'Discord', placeholder: 'username or invite link', icon: 'https://cdn.simpleicons.org/discord' },
                        ].map(({ name, label, placeholder, icon }) => (
                            <div key={name}>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src={icon} className="w-4 h-4" alt={label} />{label}
                                </label>
                                <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                    className={inputClass} style={{ fontSize: '16px' }} placeholder={placeholder} />
                            </div>
                        ))}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all">
                                {saving ? 'Saving...' : 'Save Social Links'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Notifications Tab ── */}
                {activeTab === 'notifications' && (
                    <div className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1">Email Notifications</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">Choose which activity sends you an email.</p>
                        <EmailNotificationSettings />
                    </div>
                )}

                {/* ── Security Tab ── */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSubmitPassword} className="glass-panel rounded-2xl p-4 sm:p-8 space-y-5">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Change Password</h2>
                        {[
                            { name: 'current_password', label: 'Current Password' },
                            { name: 'new_password', label: 'New Password', minLength: 6 },
                            { name: 'confirm_password', label: 'Confirm New Password' },
                        ].map(({ name, label, minLength }) => (
                            <div key={name}>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{label}</label>
                                <input type="password" name={name} value={passwordData[name]} onChange={handlePasswordChange}
                                    className={inputClass} style={{ fontSize: '16px' }} required minLength={minLength} />
                            </div>
                        ))}
                        <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Requirements</h4>
                            <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                                <li className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${passwordData.new_password.length >= 6 ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`} />
                                    At least 6 characters
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${passwordData.new_password && passwordData.new_password === passwordData.confirm_password ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`} />
                                    Passwords match
                                </li>
                            </ul>
                        </div>
                        <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors block text-center">
                            Forgot your password?
                        </Link>
                        <button type="submit" disabled={saving}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all">
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}

export default EditProfilePage;