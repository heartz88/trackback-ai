import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ProfilePage() {
const { userId } = useParams();
const { user: currentUser } = useAuth();
const [profile, setProfile] = useState(null);
const [tracks, setTracks] = useState([]);
const [activeCollabs, setActiveCollabs] = useState([]);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('tracks'); // tracks, collabs, about

const isOwnProfile = !userId || currentUser?.id?.toString() === userId;

useEffect(() => {
const fetchProfile = async () => {
    setLoading(true);
    try {
    const profileId = userId || currentUser?.id;
    
    // Fetch user profile
    const profileRes = await api.get(`/users/${profileId}`);
    setProfile(profileRes.data.user);

    // Fetch user's tracks
    const tracksRes = await api.get(`/tracks/user/${profileId}`);
    setTracks(tracksRes.data.tracks || []);

    // Fetch active collaborations
    const collabRes = await api.get(`/collaborations/active/${profileId}`);
    setActiveCollabs(collabRes.data.collaborations || []);
    
    } catch (err) {
    console.error('Failed to fetch profile:', err);
    } finally {
    setLoading(false);
    }
};

if (currentUser) {
    fetchProfile();
}
}, [userId, currentUser]);

const formatDate = (dateString) => {
if (!dateString) return '';
const date = new Date(dateString);
return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

if (loading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);
}

if (!profile) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Profile Not Found</h2>
        <Link to="/" className="text-primary-400 hover:text-primary-300">Go Home</Link>
    </div>
    </div>
);
}

return (
<div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
    {/* Header with gradient background */}
    <div className="relative h-64 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 overflow-hidden">
    {/* Animated waveform pattern background */}
    <div className="absolute inset-0 opacity-20">
        <div className="flex items-end justify-center h-full gap-1 px-4">
        {[...Array(80)].map((_, i) => (
            <div
            key={i}
            className="w-1 bg-white rounded-full visualizer-bar"
            style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.02}s`,
            }}
            />
        ))}
        </div>
    </div>
    

    </div>

    {/* Profile Content */}
    <div className="max-w-6xl mx-auto px-4 -mt-20 pb-12">
    {/* Avatar and Basic Info */}
    <div className="glass-panel rounded-3xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
        {/* Avatar */}
        <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-[var(--bg-primary)]">
            {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-[var(--bg-primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            </div>
        </div>

        {/* Name and Bio */}
        <div className="flex-1">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            {profile.username}
            </h1>
            {profile.bio && (
            <p className="text-[var(--text-secondary)] text-lg mb-4 max-w-2xl">
                {profile.bio}
            </p>
            )}
            <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-bold">{tracks.length}</span> Tracks
            </div>
            <div className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-bold">{activeCollabs.length}</span> Active Collabs
            </div>
            <div className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-secondary)]">
                Joined {formatDate(profile.created_at)}
            </div>
            </div>
        </div>

            {/* Edit button for own profile */}
    {isOwnProfile && (
        <div className="absolute top-6 right-6 z-10">
        <Link
            to="/edit-profile"
            className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20"
        >
            Edit Profile
        </Link>
        </div>
    )}

        {/* Action Button */}
        {!isOwnProfile && (
            <Link
            to={`/messages/new?userId=${profile.id}`}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
            >
            Message
            </Link>
        )}
        </div>

        {/* Skills/Tags */}
        {profile.skills && profile.skills.length > 0 && (
        <div className="pt-6 border-t border-[var(--border-color)]">
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">SKILLS</h3>
            <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
                <span
                key={index}
                className="px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-full text-sm font-medium"
                >
                {skill}
                </span>
            ))}
            </div>
        </div>
        )}
    </div>

    {/* Tabs Navigation */}
    <div className="flex gap-2 mb-8">
        <button
        onClick={() => setActiveTab('tracks')}
        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'tracks'
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        >
        Tracks ({tracks.length})
        </button>
        <button
        onClick={() => setActiveTab('collabs')}
        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'collabs'
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        >
        Collaborations ({activeCollabs.length})
        </button>
        <button
        onClick={() => setActiveTab('about')}
        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'about'
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        >
        About
        </button>
    </div>

    {/* Tab Content */}
    {activeTab === 'tracks' && (
        <div>
        {tracks.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl">
            <svg className="mx-auto h-16 w-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg mb-3">No tracks yet</p>
            {isOwnProfile && (
                <Link to="/upload" className="text-primary-400 hover:text-primary-300 font-medium">
                Upload your first track →
                </Link>
            )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => (
                <div key={track.id} className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-primary-400 transition-colors">
                        {track.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {track.bpm && (
                        <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300 font-medium">
                            {Math.round(track.bpm)} BPM
                        </span>
                        )}
                        {track.energy_level && (
                        <span className={`px-3 py-1 border rounded-full text-xs font-medium capitalize ${
                            track.energy_level === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                            track.energy_level === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}>
                            {track.energy_level}
                        </span>
                        )}
                        {track.genre && (
                        <span className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
                            {track.genre}
                        </span>
                        )}
                    </div>
                    </div>
                </div>
                <audio
                    controls
                    className="w-full rounded-lg h-10"
                    src={track.audio_url}
                >
                    Your browser does not support audio playback.
                </audio>
                </div>
            ))}
            </div>
        )}
        </div>
    )}

    {activeTab === 'collabs' && (
        <div>
        {activeCollabs.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl">
            <svg className="mx-auto h-16 w-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg mb-3">No active collaborations</p>
            {isOwnProfile && (
                <Link to="/discover" className="text-primary-400 hover:text-primary-300 font-medium">
                Discover tracks to collaborate on →
                </Link>
            )}
            </div>
        ) : (
            <div className="space-y-4">
            {activeCollabs.map((collab) => (
                <div key={collab.id} className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {collab.collaborator_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                        Collaborating with {collab.collaborator_name}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        on "{collab.track_title}"
                    </p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                    Active
                    </span>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
    )}

    {activeTab === 'about' && (
        <div className="glass-panel p-8 rounded-2xl">
        <div className="space-y-8">
            {/* Bio Section */}
            <div>
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">ABOUT</h3>
            <p className="text-[var(--text-primary)] text-lg leading-relaxed">
                {profile.bio || 'No bio provided yet.'}
            </p>
            </div>

            {/* Member Since */}
            <div>
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">MEMBER SINCE</h3>
            <p className="text-[var(--text-primary)] text-lg">
                {formatDate(profile.created_at)}
            </p>
            </div>

            {/* Contact */}
            <div>
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">CONTACT</h3>
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{profile.email}</span>
            </div>
            </div>

            {/* Preferred Genres */}
            {profile.preferred_genres && profile.preferred_genres.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">PREFERRED GENRES</h3>
                <div className="flex flex-wrap gap-2">
                {profile.preferred_genres.map((genre, index) => (
                    <span
                    key={index}
                    className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm font-medium text-[var(--text-primary)]"
                    >
                    {genre}
                    </span>
                ))}
                </div>
            </div>
            )}

            {/* Looking For */}
            {profile.looking_for && (
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-3">LOOKING FOR</h3>
                <p className="text-[var(--text-primary)]">{profile.looking_for}</p>
            </div>
            )}
        </div>
        </div>
    )}
    </div>
</div>
);
}

export default ProfilePage;