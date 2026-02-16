import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function EditProfilePage() {
const { user, login } = useAuth();
const navigate = useNavigate();
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

const [formData, setFormData] = useState({
username: '',
email: '',
bio: '',
skills: '',
looking_for_collab: true
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
        looking_for_collab: profile.looking_for_collab !== false
    });
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
    // Convert skills string to array
    const skillsArray = formData.skills
    .split(',')
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0);

    const updateData = {
    username: formData.username,
    email: formData.email,
    bio: formData.bio,
    skills: skillsArray,
    looking_for_collab: formData.looking_for_collab
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
    <div className="max-w-2xl mx-auto">
    <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Edit Profile</h1>
        <p className="text-[var(--text-secondary)]">Update your profile information</p>
    </div>

    {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">
        {error}
        </div>
    )}

    {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6">
        {success}
        </div>
    )}

    {/* Profile Info Form */}
    <form onSubmit={handleSubmitProfile} className="glass-panel rounded-3xl p-6 mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Profile Information</h2>
        <div className="space-y-4">
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Username
            </label>
            <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Email
            </label>
            <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Bio
            </label>
            <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Tell others about yourself..."
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Skills
            </label>
            <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="mixing, mastering, vocals, guitar"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Separate with commas</p>
        </div>

        <div className="flex items-center gap-3">
            <input
            type="checkbox"
            name="looking_for_collab"
            id="looking_for_collab"
            checked={formData.looking_for_collab}
            onChange={(e) => setFormData(prev => ({ ...prev, looking_for_collab: e.target.checked }))}
            className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="looking_for_collab" className="text-[var(--text-primary)] text-sm">
            Available for collaborations
            </label>
        </div>

        <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-all"
        >
            {saving ? 'Saving...' : 'Save Changes'}
        </button>
        </div>
    </form>

    {/* Password Change Form */}
    <form onSubmit={handleSubmitPassword} className="glass-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Change Password</h2>
        <div className="space-y-4">
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Current Password
            </label>
            <input
            type="password"
            name="current_password"
            value={passwordData.current_password}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            New Password
            </label>
            <input
            type="password"
            name="new_password"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            minLength={6}
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
            Confirm New Password
            </label>
            <input
            type="password"
            name="confirm_password"
            value={passwordData.confirm_password}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            />
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
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-all"
        >
            {saving ? 'Updating...' : 'Update Password'}
        </button>
        </div>
    </form>
    </div>
</div>
);
}

export default EditProfilePage;