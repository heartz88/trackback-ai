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
        } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update profile'); }
        finally { setSaving(false); }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (passwordData.new_password !== passwordData.confirm_password) { setError('Passwords do not match'); return; }
        if (passwordData.new_password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setSaving(true);
        try {
            await api.put(`/users/${user.id}/password`, { current_password: passwordData.current_password, new_password: passwordData.new_password });
            setSuccess('Password updated!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update password'); }
        finally { setSaving(false); }
    };

    const previewGenres = formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean);

    const inputClass = "w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";

    const TABS = [
        { id: 'profile', label: 'Profile', shortLabel: 'Profile'},
        { id: 'details', label: 'Music', shortLabel: 'Music' },
        { id: 'social', label: 'Social', shortLabel: 'Social' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts' },
        { id: 'security', label: 'Security', shortLabel: 'Security' },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="music-loader">{[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar" />)}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Top gradient accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />

            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <Link to={`/profile/${formData.username}`}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-primary-400 hover:bg-primary-500/10 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Edit Profile</h1>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] ml-10">Customize how you appear to other artists</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm animate-slide-down">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/40 text-green-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm animate-slide-down">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {success}
                    </div>
                )}

                {/* Tab bar — scrollable on mobile */}
                <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm flex-shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                            }`}>
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* ── PROFILE INFO TAB ── */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="space-y-5">
                        {/* Avatar card */}
                        <div className="glass-panel rounded-2xl p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Profile Picture</h2>
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar"
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-primary-500/30 shadow-xl"
                                            onError={() => setAvatarUrl('')} />
                                    ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-primary-500/30 shadow-xl">
                                            {formData.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Controls */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">JPEG, PNG, WebP · max 5MB</p>
                                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => avatarInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all">
                                            {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                                        </button>
                                        {avatarUrl && (
                                            <button type="button" onClick={handleRemoveAvatar} disabled={uploadingAvatar}
                                                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 text-sm font-semibold rounded-xl transition-all border border-[var(--border-color)] disabled:opacity-50">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic info card */}
                        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">Basic Information</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Username <span className="text-red-400">*</span></label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange}
                                        style={{ fontSize: '16px' }} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email <span className="text-red-400">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        style={{ fontSize: '16px' }} className={inputClass} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4"
                                    style={{ fontSize: '16px' }} className={inputClass + ' resize-none'}
                                    placeholder="Tell others about yourself, your music style, what you're working on…" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">A brief description about yourself and your music</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Skills</label>
                                <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                                    style={{ fontSize: '16px' }} className={inputClass}
                                    placeholder="mixing, mastering, vocals, guitar, production" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate with commas</p>
                            </div>

                            {/* Collab toggle */}
                            <label className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--bg-tertiary)]/40 rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-primary-500/40 transition-all">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" id="looking_for_collab" checked={formData.looking_for_collab}
                                        onChange={(e) => setFormData(prev => ({ ...prev, looking_for_collab: e.target.checked }))}
                                        className="sr-only" />
                                    <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${formData.looking_for_collab ? 'bg-primary-500' : 'bg-[var(--bg-tertiary)]'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${formData.looking_for_collab ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Available for collaborations</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">Show a green badge on your profile</p>
                                </div>
                            </label>
                        </div>


                        {/* Actions */}
                        <div className="flex gap-3">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <Link to={`/profile/${formData.username}`}
                                className="px-6 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold rounded-xl transition-all border border-[var(--border-color)] text-center">
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}

                {/* ── MUSIC DETAILS TAB ── */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmitProfile} className="space-y-5">
                        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-5">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">Music Details</h2>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Preferred Genres</label>
                                <input type="text" name="preferred_genres" value={formData.preferred_genres} onChange={handleChange}
                                    style={{ fontSize: '16px' }} className={inputClass}
                                    placeholder="Electronic, Hip-Hop, Rock, Jazz" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate with commas</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Equipment / Software</label>
                                <input type="text" name="equipment" value={formData.equipment} onChange={handleChange}
                                    style={{ fontSize: '16px' }} className={inputClass}
                                    placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Your DAW and instruments, separated by commas</p>
                            </div>

                            {/* Genres preview */}
                            {previewGenres.length > 0 && (
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Preview</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {previewGenres.map((g, i) => <span key={i} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-secondary)]">{g}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={saving}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                            {saving ? 'Saving…' : 'Save Details'}
                        </button>
                    </form>
                )}

                {/* ── SOCIAL LINKS TAB ── */}
                {activeTab === 'social' && (
                    <form onSubmit={handleSubmitProfile} className="space-y-5">
                        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">Social Links</h2>
                                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Connect your profiles so others can find you</p>
                            </div>

                            {/* @ handle platforms */}
                            <div className="space-y-3">
                                {[
                                    { name: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/instagram', color: 'from-purple-500 to-pink-500' },
                                    { name: 'twitter', label: 'Twitter / X', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/x', color: 'from-blue-400 to-blue-500' },
                                    { name: 'tiktok', label: 'TikTok', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/tiktok', color: 'from-gray-800 to-black' },
                                ].map(({ name, label, prefix, placeholder, icon, color }) => (
                                    <div key={name}>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                            <span className={`w-5 h-5 bg-gradient-to-br ${color} rounded flex items-center justify-center flex-shrink-0`}>
                                                <img src={icon + '/ffffff'} className="w-3 h-3" alt={label} />
                                            </span>
                                            {label}
                                        </label>
                                        <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
                                            <span className="px-3 text-[var(--text-tertiary)] text-sm border-r border-[var(--border-color)] py-3 flex-shrink-0">{prefix}</span>
                                            <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                                style={{ fontSize: '16px' }}
                                                className="flex-1 px-3 py-3 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none text-sm"
                                                placeholder={placeholder} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                                {[
                                    { name: 'soundcloud', label: 'SoundCloud', placeholder: 'soundcloud.com/username', icon: 'https://cdn.simpleicons.org/soundcloud', color: 'bg-orange-500' },
                                    { name: 'spotify', label: 'Spotify', placeholder: 'open.spotify.com/artist/…', icon: 'https://cdn.simpleicons.org/spotify', color: 'bg-green-500' },
                                    { name: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/username', icon: 'https://cdn.simpleicons.org/youtube', color: 'bg-red-600' },
                                    { name: 'discord', label: 'Discord', placeholder: 'username or invite link', icon: 'https://cdn.simpleicons.org/discord', color: 'bg-indigo-500' },
                                ].map(({ name, label, placeholder, icon, color }) => (
                                    <div key={name}>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                            <span className={`w-5 h-5 ${color} rounded flex items-center justify-center flex-shrink-0`}>
                                                <img src={icon + '/ffffff'} className="w-3 h-3" alt={label} />
                                            </span>
                                            {label}
                                        </label>
                                        <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                            style={{ fontSize: '16px' }} className={inputClass}
                                            placeholder={placeholder} />
                                    </div>
                                ))}
                            </div>

                            {/* Social preview strip */}
                            {Object.values(socialLinks).some(v => v) && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-color)]">
                                    <p className="w-full text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Preview</p>
                                    {socialLinks.instagram && <SocialBadge color="from-purple-500 to-pink-500" icon="https://cdn.simpleicons.org/instagram/ffffff" label="Instagram" />}
                                    {socialLinks.twitter && <SocialBadge color="from-blue-400 to-blue-500" icon="https://cdn.simpleicons.org/x/ffffff" label="X" />}
                                    {socialLinks.tiktok && <SocialBadge color="from-gray-800 to-black" icon="https://cdn.simpleicons.org/tiktok/ffffff" label="TikTok" />}
                                    {socialLinks.soundcloud && <SocialBadge color="bg-orange-500" icon="https://cdn.simpleicons.org/soundcloud/ffffff" label="SoundCloud" />}
                                    {socialLinks.spotify && <SocialBadge color="bg-green-500" icon="https://cdn.simpleicons.org/spotify/ffffff" label="Spotify" />}
                                    {socialLinks.youtube && <SocialBadge color="bg-red-600" icon="https://cdn.simpleicons.org/youtube/ffffff" label="YouTube" />}
                                    {socialLinks.discord && <SocialBadge color="bg-indigo-500" icon="https://cdn.simpleicons.org/discord/ffffff" label="Discord" />}
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={saving}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                            {saving ? 'Saving…' : 'Save Social Links'}
                        </button>
                    </form>
                )}

                {/* ── NOTIFICATIONS TAB ── */}
                {activeTab === 'notifications' && (
                    <div className="glass-panel rounded-2xl p-4 sm:p-6">
                        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Email Notifications</h2>
                        <p className="text-sm text-[var(--text-tertiary)] mb-5">Choose which activity sends you an email</p>
                        <EmailNotificationSettings />
                    </div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSubmitPassword} className="space-y-5">
                        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">Change Password</h2>
                            {[
                                { name: 'current_password', label: 'Current Password' },
                                { name: 'new_password', label: 'New Password', minLength: 6 },
                                { name: 'confirm_password', label: 'Confirm New Password' },
                            ].map(({ name, label, minLength }) => (
                                <div key={name}>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
                                    <input type="password" name={name} value={passwordData[name]} onChange={handlePasswordChange}
                                        style={{ fontSize: '16px' }} className={inputClass}
                                        required minLength={minLength} placeholder="••••••••" />
                                </div>
                            ))}

                            {/* Password requirements */}
                            <div className="bg-[var(--bg-tertiary)]/40 p-4 rounded-xl border border-[var(--border-color)] space-y-2">
                                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Requirements</p>
                                {[
                                    { label: 'At least 6 characters', met: passwordData.new_password.length >= 6 },
                                    { label: 'Passwords match', met: passwordData.new_password === passwordData.confirm_password && !!passwordData.new_password },
                                ].map(({ label, met }) => (
                                    <div key={label} className="flex items-center gap-2 text-sm">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${met ? 'bg-green-500/20 text-green-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                                            {met ? '✓' : '○'}
                                        </span>
                                        <span className={met ? 'text-green-400' : 'text-[var(--text-tertiary)]'}>{label}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors block text-center">
                                Forgot your current password?
                            </Link>
                        </div>

                        <button type="submit" disabled={saving}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                            {saving ? 'Updating…' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function SocialBadge({ color, icon, label }) {
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 ${color.startsWith('bg-') ? color : `bg-gradient-to-br ${color}`} rounded-lg text-white text-xs font-medium`}>
            <img src={icon} className="w-3 h-3" alt="" />
            {label}
        </div>
    );
}

export default EditProfilePage;