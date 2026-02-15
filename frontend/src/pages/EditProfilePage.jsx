import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const handleSubmit = async (e) => {
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
    };

    const response = await api.put(`/users/${user.id}`, updateData);
    
    // Update auth context with new user data
    login(localStorage.getItem('token'), response.data.user);
    
    setSuccess('Profile updated successfully!');
    
    // Redirect to profile after 1.5 seconds
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

const handleCancel = () => {
navigate(`/profile/${user.id}`);
};

if (loading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);
}

return (
<div className="min-h-screen bg-[var(--bg-primary)] px-4 transition-colors duration-300">
    <div className="max-w-3xl mx-auto">
    
    {/* Header */}
    <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Edit Profile</h1>
        <p className="text-[var(--text-secondary)]">Update your profile information</p>
    </div>

    {/* Error Message */}
    {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">
        {error}
        </div>
    )}

    {/* Success Message */}
    {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6">
        {success}
        </div>
    )}

    {/* Edit Form */}
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8">
        <div className="space-y-6">
        
        {/* Username */}
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            Username
            </label>
            <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="Your username"
            required
            />
        </div>

        {/* Email */}
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            Email
            </label>
            <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="your@email.com"
            required
            />
        </div>

        {/* Bio */}
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            Bio
            </label>
            <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
            placeholder="Tell others about yourself, your music style, what you're working on..."
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
            A brief description about yourself and your music
            </p>
        </div>

        {/* Skills */}
        <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            Skills
            </label>
            <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="e.g., mixing, mastering, vocals, guitar, production"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Separate multiple skills with commas
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
            <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none"
            >
            {saving ? (
                <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
                </span>
            ) : (
                'Save Changes'
            )}
            </button>
            
            <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-8 py-3 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-xl transition-all border border-[var(--border-color)] disabled:opacity-50"
            >
            Cancel
            </button>
        </div>
        </div>
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

export default EditProfilePage;