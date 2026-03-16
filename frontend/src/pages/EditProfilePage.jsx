import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmailNotificationSettings from '../components/common/EmailNotificationSettings';
import EditMusicTab from '../components/editprofile/EditMusicTab';
import EditProfileTab from '../components/editprofile/EditProfileTab';
import EditProfileTabs, { TABS_ORDER_IDS } from '../components/editprofile/EditProfileTabs';
import EditSecurityTab from '../components/editprofile/EditSecurityTab';
import EditSocialTab from '../components/editprofile/EditSocialTab';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function EditProfilePage() {
    const { user, login, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError]                   = useState('');
    const [success, setSuccess]               = useState('');
    const [activeTab, setActiveTab]           = useState('profile');
    const [animating, setAnimating]           = useState(false);
    const prevTab                             = useRef('profile');

    const [formData, setFormData] = useState({
        username: '', email: '', bio: '', skills: '',
        looking_for_collab: true, preferred_genres: '', equipment: '',
    });
    const [socialLinks, setSocialLinks] = useState({
        instagram: '', twitter: '', soundcloud: '',
        spotify: '', youtube: '', tiktok: '', discord: ''
    });
    const [avatarUrl, setAvatarUrl] = useState('');

    const inputClass = "w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";

    // ── Fetch profile ──────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/users/${user.id}`);
                const p = data.user;
                setFormData({
                    username:          p.username || '',
                    email:             p.email || '',
                    bio:               p.bio || '',
                    skills:            p.skills?.join(', ') || '',
                    looking_for_collab: p.looking_for_collab !== false,
                    preferred_genres:  p.preferred_genres?.join(', ') || '',
                    equipment:         p.equipment?.join(', ') || '',
                });
                if (p.social_links) setSocialLinks(prev => ({ ...prev, ...p.social_links }));
                setAvatarUrl(p.avatar_url || '');
            } catch { setError('Failed to load profile'); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, [user]);

    // ── Tab animation ──────────────────────────────────────────
    const handleTabChange = (tabId) => {
        if (tabId === activeTab) return;
        setAnimating(true);
        setError(''); setSuccess('');
        setTimeout(() => {
            prevTab.current = activeTab;
            setActiveTab(tabId);
            setAnimating(false);
        }, 180);
    };
    const slideDir = TABS_ORDER_IDS.indexOf(activeTab) > TABS_ORDER_IDS.indexOf(prevTab.current) ? 1 : -1;

    // ── Avatar ─────────────────────────────────────────────────
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
            await refreshUserData();
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
            await refreshUserData();
            setSuccess('Profile picture removed');
            setTimeout(() => setSuccess(''), 3000);
        } catch { setError('Failed to remove profile picture'); }
        finally { setUploadingAvatar(false); }
    };

    // ── Save profile / social ──────────────────────────────────
    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSaving(true);
        try {
            const res = await api.put(`/users/${user.id}`, {
                username: formData.username, email: formData.email, bio: formData.bio,
                skills:           formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                looking_for_collab: formData.looking_for_collab,
                preferred_genres: formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean),
                equipment:        formData.equipment.split(',').map(s => s.trim()).filter(Boolean),
                social_links: socialLinks,
            });
            login(localStorage.getItem('token'), res.data.user);
            setSuccess('Profile updated!');
            setTimeout(() => navigate(`/profile/${formData.username}`), 1500);
        } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update profile'); }
        finally { setSaving(false); }
    };

    // ── Save password ──────────────────────────────────────────
    const handleSubmitPassword = async (e, passwordData, resetForm) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (passwordData.new_password !== passwordData.confirm_password) { setError('Passwords do not match'); return; }
        if (passwordData.new_password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setSaving(true);
        try {
            await api.put(`/users/${user.id}/password`, {
                current_password: passwordData.current_password,
                new_password:     passwordData.new_password,
            });
            setSuccess('Password updated!');
            resetForm();
        } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update password'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="music-loader">{[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar" />)}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
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

                {/* Tab bar */}
                <EditProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

                {/* Animated tab content */}
                <div style={{
                    transition: 'opacity 0.18s ease, transform 0.18s ease',
                    opacity: animating ? 0 : 1,
                    transform: animating ? `translateX(${slideDir * 24}px)` : 'translateX(0)',
                }}>
                    {activeTab === 'profile' && (
                        <EditProfileTab
                            formData={formData} setFormData={setFormData}
                            avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl}
                            uploadingAvatar={uploadingAvatar} saving={saving}
                            onSubmit={handleSubmitProfile}
                            onAvatarChange={handleAvatarChange}
                            onRemoveAvatar={handleRemoveAvatar}
                            inputClass={inputClass}
                        />
                    )}
                    {activeTab === 'details' && (
                        <EditMusicTab
                            formData={formData} setFormData={setFormData}
                            saving={saving} onSubmit={handleSubmitProfile}
                            inputClass={inputClass}
                        />
                    )}
                    {activeTab === 'social' && (
                        <EditSocialTab
                            socialLinks={socialLinks} setSocialLinks={setSocialLinks}
                            saving={saving} onSubmit={handleSubmitProfile}
                            inputClass={inputClass}
                        />
                    )}
                    {activeTab === 'notifications' && (
                        <div className="glass-panel rounded-2xl p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Email Notifications</h2>
                            <p className="text-sm text-[var(--text-tertiary)] mb-5">Choose which activity sends you an email</p>
                            <EmailNotificationSettings />
                        </div>
                    )}
                    {activeTab === 'security' && (
                        <EditSecurityTab
                            saving={saving}
                            onSubmit={handleSubmitPassword}
                            inputClass={inputClass}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditProfilePage;