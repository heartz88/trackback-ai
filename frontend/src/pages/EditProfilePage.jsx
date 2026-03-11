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
const [showPreview, setShowPreview] = useState(false);
const avatarInputRef = useRef(null);

const [formData, setFormData] = useState({
username: '',
email: '',
bio: '',
skills: '',
looking_for_collab: true,
preferred_genres: '',
equipment: '',
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
        if (profile.social_links) {
            setSocialLinks({
                instagram: profile.social_links.instagram || '',
                twitter: profile.social_links.twitter || '',
                soundcloud: profile.social_links.soundcloud || '',
                spotify: profile.social_links.spotify || '',
                youtube: profile.social_links.youtube || '',
                tiktok: profile.social_links.tiktok || '',
                discord: profile.social_links.discord || ''
            });
        }
        setAvatarUrl(profile.avatar_url || '');
    } catch (err) {
        setError('Failed to load profile');
    } finally {
        setLoading(false);
    }
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

// Show instant preview
const localUrl = URL.createObjectURL(file);
setAvatarUrl(localUrl);
setUploadingAvatar(true);
setError('');

try {
    const fd = new FormData();
    fd.append('avatar', file);
    // FIX 1: was '/users/avatar' — backend route is /users/:userId/avatar
    const res = await api.post(`/users/${user.id}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    setAvatarUrl(res.data.avatar_url);
    // FIX 3: update auth context so nav avatar refreshes without page reload
    login(localStorage.getItem('token'), { ...user, avatar_url: res.data.avatar_url });
    setSuccess('Profile picture updated!');
    setTimeout(() => setSuccess(''), 3000);
} catch (err) {
    setError(err.response?.data?.error?.message || 'Failed to upload image');
    setAvatarUrl('');
} finally {
    setUploadingAvatar(false);
}
};

// FIX 2: was just `setAvatarUrl('')` — now calls the DELETE endpoint too
const handleRemoveAvatar = async () => {
setUploadingAvatar(true);
setError('');
try {
    await api.delete(`/users/${user.id}/avatar`);
    setAvatarUrl('');
    login(localStorage.getItem('token'), { ...user, avatar_url: null });
    setSuccess('Profile picture removed');
    setTimeout(() => setSuccess(''), 3000);
} catch (err) {
    setError('Failed to remove profile picture');
} finally {
    setUploadingAvatar(false);
}
};

const handleSubmitProfile = async (e) => {
e.preventDefault();
setError(''); setSuccess(''); setSaving(true);
try {
    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const genresArray = formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean);
    const equipmentArray = formData.equipment.split(',').map(s => s.trim()).filter(Boolean);

    const response = await api.put(`/users/${user.id}`, {
        username: formData.username, email: formData.email,
        bio: formData.bio, skills: skillsArray,
        looking_for_collab: formData.looking_for_collab,
        preferred_genres: genresArray, equipment: equipmentArray,
        social_links: socialLinks
    });

    login(localStorage.getItem('token'), response.data.user);
    setSuccess('Profile updated successfully!');
    setTimeout(() => navigate(`/profile/${formData.username}`), 1500);
} catch (err) {
    setError(err.response?.data?.error?.message || 'Failed to update profile');
} finally {
    setSaving(false);
}
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
    setSuccess('Password updated successfully!');
    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
} catch (err) {
    setError(err.response?.data?.error?.message || 'Failed to update password');
} finally {
    setSaving(false);
}
};

// Derived preview data from live form state
const previewSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
const previewGenres = formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean);

if (loading) return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="music-loader">{[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar" />)}</div>
</div>
);

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-4 px-3 sm:px-4">
    <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8 flex-wrap gap-3">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">Edit Profile</h1>
                <p className="text-[var(--text-secondary)]">Customize your profile and connect with other artists</p>
            </div>
            <button
                onClick={() => setShowPreview(p => !p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${showPreview ? 'bg-primary-600 border-primary-500 text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {showPreview ? 'Hide Preview' : 'Preview Profile'}
            </button>
        </div>

        <div className={`flex gap-4 sm:gap-8 ${showPreview ? 'flex-col lg:flex-row' : ''}`}>
            {/* Editor column */}
            <div className={showPreview ? 'flex-1 min-w-0' : 'max-w-3xl mx-auto w-full'}>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {success}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
                    {[
                        { id: 'profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, label: 'Profile Info' },
                        { id: 'details', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>, label: 'Music Details' },
                        { id: 'social', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, label: 'Social Links' },
                        { id: 'notifications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>, label: 'Notifications' },
                        { id: 'security', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, label: 'Security' },
                    ].map(tab => (
                        <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
                    ))}
                </div>

                {/* Profile Info Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Basic Information</h2>

                        {/* Avatar Upload */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-color)]">
                            <div className="relative flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-primary-500/30"
                                        onError={() => setAvatarUrl('')} />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-primary-500/30">
                                        {formData.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Profile Picture</p>
                                <p className="text-xs text-[var(--text-tertiary)] mb-3">JPEG, PNG, WebP or GIF — max 5MB</p>
                                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                <button type="button" onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all">
                                    {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                                </button>
                                {avatarUrl && (
                                    <button type="button" onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar}
                                        className="ml-3 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 text-sm font-semibold rounded-xl transition-all border border-[var(--border-color)] disabled:opacity-50">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Username <span className="text-red-400">*</span></label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Email <span className="text-red-400">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4"
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="Tell others about yourself, your music style, what you're working on..." />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">A brief description about yourself and your music</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Skills</label>
                                <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="mixing, mastering, vocals, guitar, production" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">Separate multiple skills with commas</p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                                <input type="checkbox" id="looking_for_collab" checked={formData.looking_for_collab}
                                    onChange={(e) => setFormData(prev => ({ ...prev, looking_for_collab: e.target.checked }))}
                                    className="w-5 h-5 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-primary-600 focus:ring-primary-500" />
                                <label htmlFor="looking_for_collab" className="text-[var(--text-primary)]">Available for collaborations</label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link to={`/profile/${formData.username}`}
                                className="px-8 py-3 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-xl transition-all border border-[var(--border-color)] text-center">
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}

                {/* Music Details Tab */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Music Details</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Preferred Genres</label>
                                <input type="text" name="preferred_genres" value={formData.preferred_genres} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Electronic, Hip-Hop, Rock, Jazz" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">What genres do you typically work in? Separate with commas</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Equipment / Software</label>
                                <input type="text" name="equipment" value={formData.equipment} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone" />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">What DAW do you use? Separate with commas</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all">
                                {saving ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Social Links Tab */}
                {activeTab === 'social' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Social Links</h2>
                        <p className="text-[var(--text-secondary)] mb-6">Connect your social media profiles</p>
                        <div className="space-y-5">
                            {[
                                { name: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/instagram' },
                                { name: 'twitter', label: 'Twitter / X', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/x' },
                                { name: 'tiktok', label: 'TikTok', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/tiktok' },
                            ].map(({ name, label, prefix, placeholder, icon }) => (
                                <div key={name}>
                                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                        <img src={icon} className="w-5 h-5" alt={label} />{label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--text-tertiary)]">{prefix}</span>
                                        <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                            className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder={placeholder} />
                                    </div>
                                </div>
                            ))}
                            {[
                                { name: 'soundcloud', label: 'SoundCloud', placeholder: 'soundcloud.com/username', icon: 'https://cdn.simpleicons.org/soundcloud' },
                                { name: 'spotify', label: 'Spotify', placeholder: 'open.spotify.com/artist/...', icon: 'https://cdn.simpleicons.org/spotify' },
                                { name: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/username', icon: 'https://cdn.simpleicons.org/youtube' },
                                { name: 'discord', label: 'Discord', placeholder: 'username or invite link', icon: 'https://cdn.simpleicons.org/discord' },
                            ].map(({ name, label, placeholder, icon }) => (
                                <div key={name}>
                                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                        <img src={icon} className="w-5 h-5" alt={label} />{label}
                                    </label>
                                    <input type="text" name={name} value={socialLinks[name]} onChange={handleSocialChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder={placeholder} />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all">
                                {saving ? 'Saving...' : 'Save Social Links'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Email Notifications</h2>
                        <p className="text-[var(--text-secondary)] text-sm mb-6">Choose which activity sends you an email.</p>
                        <EmailNotificationSettings />
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSubmitPassword} className="glass-panel rounded-2xl p-4 sm:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Change Password</h2>
                        <div className="space-y-5">
                            {[
                                { name: 'current_password', label: 'Current Password' },
                                { name: 'new_password', label: 'New Password', minLength: 6 },
                                { name: 'confirm_password', label: 'Confirm New Password' },
                            ].map(({ name, label, minLength }) => (
                                <div key={name}>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{label}</label>
                                    <input type="password" name={name} value={passwordData[name]} onChange={handlePasswordChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required minLength={minLength} />
                                </div>
                            ))}
                            <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Requirements:</h4>
                                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                    <li className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${passwordData.new_password.length >= 6 ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`} />
                                        At least 6 characters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${passwordData.new_password === passwordData.confirm_password && passwordData.new_password ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`} />
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
                        </div>
                    </form>
                )}
            </div>

            {/* Live Preview Panel */}
            {showPreview && (
                <div className="lg:w-80 flex-shrink-0">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Live Preview</p>
                        </div>
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            {/* Mini banner */}
                            <div className="h-16 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600" />
                            <div className="px-5 pb-5 -mt-8">
                                {/* Avatar */}
                                <div className="mb-3">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-4 border-[var(--bg-primary)] shadow-xl" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold border-4 border-[var(--bg-primary)] shadow-xl">
                                            {formData.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                {/* Name + collab badge */}
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">{formData.username || 'Username'}</h3>
                                    {formData.looking_for_collab && (
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">✓ Open to collabs</span>
                                    )}
                                </div>
                                {/* URL slug */}
                                <p className="text-xs text-[var(--text-tertiary)] mb-3">trackbackai.me/profile/{formData.username || 'username'}</p>
                                {/* Bio */}
                                {formData.bio && <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed line-clamp-3">{formData.bio}</p>}
                                {/* Skills */}
                                {previewSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {previewSkills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-400">{s}</span>
                                        ))}
                                        {previewSkills.length > 4 && <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-xs text-[var(--text-tertiary)]">+{previewSkills.length - 4}</span>}
                                    </div>
                                )}
                                {/* Genres */}
                                {previewGenres.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Genres</p>
                                        <div className="flex flex-wrap gap-1">
                                            {previewGenres.slice(0, 3).map((g, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Social icons */}
                                {Object.values(socialLinks).some(v => v) && (
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-color)]">
                                        {socialLinks.instagram && <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/instagram/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.twitter && <div className="w-7 h-7 bg-blue-400 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/x/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.soundcloud && <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/soundcloud/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.spotify && <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/spotify/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.youtube && <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/youtube/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.discord && <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/discord/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                        {socialLinks.tiktok && <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center"><img src="https://cdn.simpleicons.org/tiktok/ffffff" className="w-3.5 h-3.5" alt="" /></div>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Link to={`/profile/${formData.username}`}
                            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-xl transition-all border border-[var(--border-color)] text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            View Full Profile
                        </Link>
                    </div>
                </div>
            )}
        </div>
    </div>
</div>
);
}

const TabButton = ({ active, onClick, icon, label }) => (
<button onClick={onClick}
className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
{icon}<span>{label}</span>
</button>
);

export default EditProfilePage;