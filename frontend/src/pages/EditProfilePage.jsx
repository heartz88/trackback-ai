import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Tiny helpers ─────────────────────────────────────────────────────────────
const initials = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

function EditProfilePage() {
    const { user, login } = useAuth();
    const navigate         = useNavigate();
    const fileInputRef     = useRef(null);

    const [loading,       setLoading]       = useState(true);
    const [saving,        setSaving]        = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [error,         setError]         = useState('');
    const [success,       setSuccess]       = useState('');
    const [activeTab,     setActiveTab]     = useState('profile');

    // Live avatar state — shows immediately after upload/remove
    const [avatarUrl,     setAvatarUrl]     = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null); // local blob URL

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
        spotify: '', youtube: '', tiktok: '', discord: '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '', new_password: '', confirm_password: '',
    });

    // ── Fetch profile ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            try {
                const { data } = await api.get(`/users/${user.id}`);
                const p = data.user;

                setFormData({
                    username:          p.username             || '',
                    email:             p.email                || '',
                    bio:               p.bio                  || '',
                    skills:            p.skills               ? p.skills.join(', ')            : '',
                    looking_for_collab:p.looking_for_collab   !== false,
                    preferred_genres:  p.preferred_genres     ? p.preferred_genres.join(', ')  : '',
                    equipment:         p.equipment            ? p.equipment.join(', ')         : '',
                });

                if (p.social_links) setSocialLinks({
                    instagram:  p.social_links.instagram  || '',
                    twitter:    p.social_links.twitter    || '',
                    soundcloud: p.social_links.soundcloud || '',
                    spotify:    p.social_links.spotify    || '',
                    youtube:    p.social_links.youtube    || '',
                    tiktok:     p.social_links.tiktok     || '',
                    discord:    p.social_links.discord    || '',
                });

                // Set avatar from DB
                if (p.avatar_url) setAvatarUrl(p.avatar_url);
            } catch (e) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [user]);

    // ── Avatar: pick file → preview instantly ─────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate client-side
        const ok = ['image/jpeg','image/png','image/webp','image/gif'].includes(file.type);
        if (!ok)          { setError('Only JPEG, PNG, WebP or GIF images are allowed'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }

        // Show local preview immediately
        const blobUrl = URL.createObjectURL(file);
        setAvatarPreview(blobUrl);
        setError('');

        // Upload straight away
        uploadAvatar(file);
    };

    const uploadAvatar = async (file) => {
        setAvatarLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const { data } = await api.post(`/users/${user.id}/avatar`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Use the signed URL from the server
            setAvatarUrl(data.avatar_url);
            // Update auth context so nav avatar refreshes too
            login(localStorage.getItem('token'), { ...user, avatar_url: data.avatar_url });
            setSuccess('Profile picture updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.error?.message || 'Failed to upload avatar');
            setAvatarPreview(null); // revert preview
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setAvatarLoading(true);
        setError('');
        try {
            await api.delete(`/users/${user.id}/avatar`);
            setAvatarUrl(null);
            setAvatarPreview(null);
            login(localStorage.getItem('token'), { ...user, avatar_url: null });
            setSuccess('Profile picture removed');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError('Failed to remove avatar');
        } finally {
            setAvatarLoading(false);
        }
    };

    // The image to show: prefer local preview > server URL > null (shows initials)
    const displayImage = avatarPreview || avatarUrl;

    // ── Form handlers ─────────────────────────────────────────────────────
    const handleChange       = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSocialChange = e => setSocialLinks(p => ({ ...p, [e.target.name]: e.target.value }));
    const handlePwChange     = e => setPasswordData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSaving(true);
        try {
            const split = str => str.split(',').map(s => s.trim()).filter(Boolean);
            const { data } = await api.put(`/users/${user.id}`, {
                username:          formData.username,
                email:             formData.email,
                bio:               formData.bio,
                skills:            split(formData.skills),
                looking_for_collab:formData.looking_for_collab,
                preferred_genres:  split(formData.preferred_genres),
                equipment:         split(formData.equipment),
                social_links:      socialLinks,
            });
            login(localStorage.getItem('token'), data.user);
            setSuccess('Profile updated successfully!');
            setTimeout(() => navigate(`/profile/${user.id}`), 1500);
        } catch (e) {
            setError(e.response?.data?.error?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (passwordData.new_password !== passwordData.confirm_password) return setError('Passwords do not match');
        if (passwordData.new_password.length < 6) return setError('Password must be at least 6 characters');
        setSaving(true);
        try {
            await api.put(`/users/${user.id}/password`, {
                current_password: passwordData.current_password,
                new_password:     passwordData.new_password,
            });
            setSuccess('Password updated!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (e) {
            setError(e.response?.data?.error?.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="music-loader">
                {[...Array(5)].map((_,i) => <span key={i} className="music-loader-bar"/>)}
            </div>
        </div>
    );

    // ── JSX ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Edit Profile</h1>
                    <p className="text-[var(--text-secondary)]">Customise your profile and connect with other artists</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        {success}
                    </div>
                )}

                {/* Tab Bar */}
                <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
                    {[
                        { id:'profile',  label:'Profile Info',   icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { id:'details',  label:'Music Details',  icon:'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
                        { id:'social',   label:'Social Links',   icon:'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                        { id:'notifications', label:'Notifications', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                        { id:'security', label:'Security',       icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                    ].map(tab => (
                        <TabButton key={tab.id} active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)} label={tab.label}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon}/>
                            </svg>}
                        />
                    ))}
                </div>

                {/* ── Profile Info Tab ── */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Basic Information</h2>

                        {/* Avatar Section */}
                        <div className="mb-8 p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/20">
                            <div className="flex items-center gap-5 flex-wrap">
                                {/* Avatar circle */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent-primary)] relative">
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={() => {
                                                    // If the signed URL expires/fails, fall back to initials
                                                    setAvatarUrl(null);
                                                    setAvatarPreview(null);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                                                style={{ background: 'linear-gradient(135deg, var(--accent-primary-dark), var(--accent-primary))' }}>
                                                {initials(formData.username || user?.username)}
                                            </div>
                                        )}
                                        {/* Loading overlay */}
                                        {avatarLoading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload info + buttons */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[var(--text-primary)] mb-1">Profile Picture</p>
                                    <p className="text-sm text-[var(--text-tertiary)] mb-3">JPEG, PNG, WebP or GIF — max 5 MB</p>
                                    <div className="flex gap-3 flex-wrap">
                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={avatarLoading}
                                            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                                        >
                                            {avatarLoading ? 'Uploading…' : displayImage ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                        {displayImage && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                disabled={avatarLoading}
                                                className="btn-secondary px-5 py-2 text-sm disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Username" required>
                                    <input type="text" name="username" value={formData.username}
                                        onChange={handleChange} required className="ep-input"/>
                                </Field>
                                <Field label="Email" required>
                                    <input type="email" name="email" value={formData.email}
                                        onChange={handleChange} required className="ep-input"/>
                                </Field>
                            </div>

                            <Field label="Bio" hint="Tell others about yourself, your music style, what you're working on…">
                                <textarea name="bio" value={formData.bio} onChange={handleChange}
                                    rows="4" className="ep-input resize-none"
                                    placeholder="Tell others about yourself…"/>
                            </Field>

                            <Field label="Skills" hint="Separate with commas — e.g. mixing, mastering, vocals, guitar">
                                <input type="text" name="skills" value={formData.skills}
                                    onChange={handleChange} className="ep-input"
                                    placeholder="mixing, mastering, vocals, guitar, production"/>
                            </Field>

                            <label className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)] cursor-pointer">
                                <input type="checkbox" checked={formData.looking_for_collab}
                                    onChange={e => setFormData(p => ({ ...p, looking_for_collab: e.target.checked }))}
                                    className="w-5 h-5 rounded accent-[var(--accent-primary)]"/>
                                <span className="text-[var(--text-primary)] font-medium">Available for collaborations</span>
                            </label>
                        </div>

                        <FormFooter saving={saving} userId={user?.id}/>
                    </form>
                )}

                {/* ── Music Details Tab ── */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Music Details</h2>
                        <div className="space-y-6">
                            <Field label="Preferred Genres" hint="Separate with commas — e.g. Electronic, Hip-Hop, Rock">
                                <input type="text" name="preferred_genres" value={formData.preferred_genres}
                                    onChange={handleChange} className="ep-input"
                                    placeholder="Electronic, Hip-Hop, Rock, Jazz"/>
                            </Field>
                            <Field label="Equipment / Software" hint="Your DAW and instruments, separated by commas">
                                <input type="text" name="equipment" value={formData.equipment}
                                    onChange={handleChange} className="ep-input"
                                    placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone"/>
                            </Field>
                        </div>
                        <FormFooter saving={saving} userId={user?.id} label="Save Details"/>
                    </form>
                )}

                {/* ── Social Links Tab ── */}
                {activeTab === 'social' && (
                    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Social Links</h2>
                        <p className="text-[var(--text-secondary)] mb-6">Connect your social media profiles</p>
                        <div className="space-y-5">
                            {[
                                { name:'instagram',  label:'Instagram',  icon:'instagram',  prefix:'@',  placeholder:'username' },
                                { name:'twitter',    label:'Twitter / X', icon:'x',         prefix:'@',  placeholder:'username' },
                                { name:'soundcloud', label:'SoundCloud', icon:'soundcloud',              placeholder:'soundcloud.com/username' },
                                { name:'spotify',    label:'Spotify',    icon:'spotify',                placeholder:'open.spotify.com/artist/…' },
                                { name:'youtube',    label:'YouTube',    icon:'youtube',                placeholder:'youtube.com/c/username' },
                                { name:'tiktok',     label:'TikTok',     icon:'tiktok',     prefix:'@',  placeholder:'username' },
                                { name:'discord',    label:'Discord',    icon:'discord',                placeholder:'username or invite link',
                                hint:'Enter your Discord username or server invite' },
                            ].map(({ name, label, icon, prefix, placeholder, hint }) => (
                                <Field key={name} label={label}
                                    labelExtra={<img src={`https://cdn.simpleicons.org/${icon}`} className="w-5 h-5" alt={label}/>}
                                    hint={hint}>
                                    <div className="flex items-center gap-2">
                                        {prefix && <span className="text-[var(--text-tertiary)] font-medium">{prefix}</span>}
                                        <input type="text" name={name} value={socialLinks[name]}
                                            onChange={handleSocialChange}
                                            className="ep-input flex-1"
                                            placeholder={placeholder}/>
                                    </div>
                                </Field>
                            ))}
                        </div>
                        <FormFooter saving={saving} userId={user?.id} label="Save Social Links"/>
                    </form>
                )}

                {/* ── Notifications Tab ── */}
                {activeTab === 'notifications' && (
                    <div className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Notifications</h2>
                        <p className="text-[var(--text-secondary)]">Notification preferences coming soon.</p>
                    </div>
                )}

                {/* ── Security Tab ── */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSubmitPassword} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Change Password</h2>
                        <div className="space-y-5">
                            {[
                                { name:'current_password', label:'Current Password' },
                                { name:'new_password',     label:'New Password',     minLength:6 },
                                { name:'confirm_password', label:'Confirm New Password' },
                            ].map(({ name, label, minLength }) => (
                                <Field key={name} label={label}>
                                    <input type="password" name={name}
                                        value={passwordData[name]}
                                        onChange={handlePwChange}
                                        className="ep-input" required
                                        minLength={minLength}/>
                                </Field>
                            ))}

                            <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Password Requirements:</h4>
                                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                    <li className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${passwordData.new_password.length >= 6 ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}/>
                                        At least 6 characters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${passwordData.new_password && passwordData.new_password === passwordData.confirm_password ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}/>
                                        Passwords match
                                    </li>
                                </ul>
                            </div>

                            <Link to="/forgot-password" className="text-sm text-[var(--accent-primary)] hover:opacity-80 block text-center transition-opacity">
                                Forgot your password?
                            </Link>

                            <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
                                {saving ? 'Updating…' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Scoped styles for form inputs */}
            <style>{`
                .ep-input {
                    width: 100%;
                    padding: 11px 14px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    color: var(--text-primary);
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                    font-family: inherit;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .ep-input:focus {
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 12%, transparent);
                }
                .ep-input:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
            active
                ? 'text-white shadow-lg'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
        style={active ? { background:'linear-gradient(135deg, var(--accent-primary-dark), var(--accent-primary))' } : {}}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const Field = ({ label, required, hint, labelExtra, children }) => (
    <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-2">
            {labelExtra}
            {label}
            {required && <span className="text-red-400">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{hint}</p>}
    </div>
);

const FormFooter = ({ saving, userId, label = 'Save Changes' }) => (
    <div className="flex gap-4 pt-8 mt-6 border-t border-[var(--border-color)]">
        <button type="submit" disabled={saving}
            className="btn-primary flex-1 py-3 disabled:opacity-50">
            {saving ? 'Saving…' : label}
        </button>
        <Link to={`/profile/${userId}`}
            className="btn-secondary px-8 py-3 text-center">
            Cancel
        </Link>
    </div>
);

export default EditProfilePage;