import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmailNotificationSettings from '../components/common/EmailNotificationSettings';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function EditProfilePage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

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
        instagram: '',
        twitter: '',
        soundcloud: '',
        spotify: '',
        youtube: '',
        tiktok: '',
        discord: ''
        
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

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
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSocialChange = (e) => {
        const { name, value } = e.target;
        setSocialLinks(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const skillsArray = formData.skills
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            const genresArray = formData.preferred_genres
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            const equipmentArray = formData.equipment
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            const updateData = {
                username: formData.username,
                email: formData.email,
                bio: formData.bio,
                skills: skillsArray,
                looking_for_collab: formData.looking_for_collab,
                preferred_genres: genresArray,
                equipment: equipmentArray,
                social_links: socialLinks
            };

            const response = await api.put(`/users/${user.id}`, updateData);

            login(localStorage.getItem('token'), response.data.user);
            setSuccess('Profile updated successfully!');

            setTimeout(() => {
                navigate(`/profile/${user.id}`);
            }, 1500);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.error?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSaving(true);

        try {
            await api.put(`/users/${user.id}/password`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            setSuccess('Password updated successfully!');
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (err) {
            console.error('Failed to update password:', err);
            setError(err.response?.data?.error?.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="music-loader">
                    <span className="music-loader-bar"></span>
                    <span className="music-loader-bar"></span>
                    <span className="music-loader-bar"></span>
                    <span className="music-loader-bar"></span>
                    <span className="music-loader-bar"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Edit Profile</h1>
                    <p className="text-[var(--text-secondary)]">Customize your profile and connect with other artists</p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {success}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                        label="Profile Info"
                    />
                    <TabButton
                        active={activeTab === 'details'}
                        onClick={() => setActiveTab('details')}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        }
                        label="Music Details"
                    />
                    <TabButton
                        active={activeTab === 'social'}
                        onClick={() => setActiveTab('social')}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        }
                        label="Social Links"
                    />
                    <TabButton
                        active={activeTab === 'notifications'}
                        onClick={() => setActiveTab('notifications')}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        }
                        label="Notifications"
                    />
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                        label="Security"
                    />
                </div>

                {/* Profile Info Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Basic Information</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                        Username <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                        Email <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="Tell others about yourself, your music style, what you're working on..."
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                    A brief description about yourself and your music
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Skills
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="mixing, mastering, vocals, guitar, production"
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                    Separate multiple skills with commas
                                </p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                                <input
                                    type="checkbox"
                                    name="looking_for_collab"
                                    id="looking_for_collab"
                                    checked={formData.looking_for_collab}
                                    onChange={(e) => setFormData(prev => ({ ...prev, looking_for_collab: e.target.checked }))}
                                    className="w-5 h-5 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="looking_for_collab" className="text-[var(--text-primary)]">
                                    Available for collaborations
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 mt-6 border-t border-[var(--border-color)]">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link
                                to={`/profile/${user.id}`}
                                className="px-8 py-3 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-xl transition-all border border-[var(--border-color)]"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}

                {/* Music Details Tab */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Music Details</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Preferred Genres
                                </label>
                                <input
                                    type="text"
                                    name="preferred_genres"
                                    value={formData.preferred_genres}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Electronic, Hip-Hop, Rock, Jazz"
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                    What genres do you typically work in? Separate with commas
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Equipment / Software
                                </label>
                                <input
                                    type="text"
                                    name="equipment"
                                    value={formData.equipment}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone"
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                    What DAW do you use? Separate with commas
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 mt-6 border-t border-[var(--border-color)]">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                            >
                                {saving ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Social Links Tab */}
                {activeTab === 'social' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Social Links</h2>
                        <p className="text-[var(--text-secondary)] mb-6">Connect your social media profiles</p>
                        
                        <div className="space-y-5">
                            {/* Instagram */}
                            <div>
                            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                <img src="https://cdn.simpleicons.org/instagram" className="w-6 h-6" alt="Instagram" />
                                Instagram
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-tertiary)]">@</span>
                                    <input
                                        type="text"
                                        name="instagram"
                                        value={socialLinks.instagram}
                                        onChange={handleSocialChange}
                                        className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            {/* Twitter / X */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/x" className="w-6 h-6" alt="X" />
                                    Twitter / X
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-tertiary)]">@</span>
                                    <input
                                        type="text"
                                        name="twitter"
                                        value={socialLinks.twitter}
                                        onChange={handleSocialChange}
                                        className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            {/* SoundCloud */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/soundcloud" className="w-6 h-6" alt="SoundCloud" />
                                    SoundCloud
                                </label>
                                <input
                                    type="text"
                                    name="soundcloud"
                                    value={socialLinks.soundcloud}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="soundcloud.com/username"
                                />
                            </div>

                            {/* Spotify */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/spotify" className="w-6 h-6" alt="Spotify" />
                                    Spotify
                                </label>
                                <input
                                    type="text"
                                    name="spotify"
                                    value={socialLinks.spotify}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="open.spotify.com/artist/..."
                                />
                            </div>

                            {/* YouTube */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/youtube" className="w-6 h-6" alt="YouTube" />
                                    YouTube
                                </label>
                                <input
                                    type="text"
                                    name="youtube"
                                    value={socialLinks.youtube}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="youtube.com/c/username"
                                />
                            </div>

                            {/* Discord */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/discord" className="w-6 h-6" alt="Discord" />
                                    Discord
                                </label>
                                <input
                                    type="text"
                                    name="discord"
                                    value={socialLinks.discord}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="username or invite link"
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">Enter your Discord username or server invite</p>
                            </div>

                            {/* TikTok */}
                            <div>
                                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <img src="https://cdn.simpleicons.org/tiktok" className="w-6 h-6" alt="TikTok" />
                                    TikTok
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-tertiary)]">@</span>
                                    <input
                                        type="text"
                                        name="tiktok"
                                        value={socialLinks.tiktok}
                                        onChange={handleSocialChange}
                                        className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 mt-6 border-t border-[var(--border-color)]">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                            >
                                {saving ? 'Saving...' : 'Save Social Links'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="glass-panel rounded-3xl p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Email Notifications</h2>
                            <p className="text-[var(--text-secondary)] text-sm">
                                Choose which activity sends you an email. You'll always see notifications inside the app regardless of these settings.
                            </p>
                        </div>
                        <EmailNotificationSettings />
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSubmitPassword} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Change Password</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    name="confirm_password"
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Password Requirements:</h4>
                                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                    <li className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${passwordData.new_password.length >= 6 ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}></span>
                                        At least 6 characters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${passwordData.new_password === passwordData.confirm_password && passwordData.new_password ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}></span>
                                        Passwords match
                                    </li>
                                </ul>
                            </div>

                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-400 hover:text-primary-300 transition-colors block text-center"
                            >
                                Forgot your password?
                            </Link>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                            >
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
            active
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default EditProfilePage;