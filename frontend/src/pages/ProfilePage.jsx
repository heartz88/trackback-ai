import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ProfilePage() {
const { userId } = useParams();
const { user: currentUser } = useAuth();
const [profile, setProfile] = useState(null);
const [tracks, setTracks] = useState([]);
const [collaborations, setCollaborations] = useState([]);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('tracks');
const [playingTrackId, setPlayingTrackId] = useState(null);

const isOwnProfile = !userId || currentUser?.id?.toString() === userId;
const profileId = userId || currentUser?.id;

useEffect(() => {
if (profileId) {
    fetchProfileData();
}
}, [profileId]);

const fetchProfileData = async () => {
setLoading(true);
try {
// Use Promise.allSettled to handle individual failures
const [profileRes, tracksRes, collabRes] = await Promise.allSettled([
    api.get(`/users/${profileId}`),
    api.get(`/tracks/user/${profileId}`),
    api.get(`/collaborations/user/${profileId}`)
]);

// Handle profile data
if (profileRes.status === 'fulfilled') {
    setProfile(profileRes.value.data.user);
} else {
    console.error('Profile fetch failed:', profileRes.reason);
}

// Handle tracks data
if (tracksRes.status === 'fulfilled') {
    setTracks(tracksRes.value.data.tracks || []);
} else {
    console.log('Tracks not available yet');
    setTracks([]);
}

// Handle collaborations data
if (collabRes.status === 'fulfilled') {
    setCollaborations(collabRes.value.data.collaborations || []);
} else {
    console.log('Collaborations not available yet');
    setCollaborations([]);
}

} catch (err) {
console.error('Failed to fetch profile:', err);
} finally {
setLoading(false);
}
};

const formatDate = (dateString) => {
if (!dateString) return '';
const date = new Date(dateString);
return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatLastActive = (dateString) => {
if (!dateString) return 'Unknown';
const date = new Date(dateString);
const now = new Date();
const diffInSeconds = Math.floor((now - date) / 1000);

if (diffInSeconds < 60) return 'Online now';
if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
return date.toLocaleDateString();
};

const handlePlayTrack = (trackId) => {
setPlayingTrackId(playingTrackId === trackId ? null : trackId);
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

if (!profile) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center glass-panel p-12 rounded-3xl max-w-md">
        <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Profile Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-6">The user you're looking for doesn't exist</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Go Home
        </Link>
    </div>
    </div>
);
}

return (
<div className="min-h-screen bg-[var(--bg-primary)]">
    {/* Profile Header */}
    <div className="relative h-48 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0,100 Q150,50 300,100 T600,100 T900,100 T1200,100" 
                stroke="white" fill="none" strokeWidth="2"/>
        </svg>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
    </div>

    {/* Profile Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-16 relative z-10">
    {/* Profile Card */}
    <div className="glass-panel rounded-3xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
            <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white/20 shadow-2xl">
                {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            {profile.looking_for_collab && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-[var(--bg-primary)]">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                </div>
            )}
            </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                {profile.username}
                </h1>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] flex-wrap">
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Joined {formatDate(profile.created_at)}
                </span>
                <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full"></span>
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last active {formatLastActive(profile.last_active)}
                </span>
                </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile ? (
                <Link
                to="/edit-profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] hover:text-primary-400 rounded-xl transition-all border border-[var(--border-color)]"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
                </Link>
            ) : (
                <Link
                to={`/messages/new?userId=${profile.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/30"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send Message
                </Link>
            )}
            </div>

            {/* Bio */}
            {profile.bio && (
            <div className="mb-6 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                {profile.bio}
                </p>
            </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs">
            <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4 text-center border border-[var(--border-color)]">
                <div className="text-2xl font-bold text-primary-400">{tracks.length}</div>
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Tracks</div>
            </div>
            <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4 text-center border border-[var(--border-color)]">
                <div className="text-2xl font-bold text-primary-400">{collaborations.length}</div>
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Collabs</div>
            </div>
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                    <span
                    key={index}
                    className="px-3 py-1.5 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-full text-sm font-medium"
                    >
                    {skill}
                    </span>
                ))}
                </div>
            </div>
            )}
        </div>
        </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
        <TabButton 
        active={activeTab === 'tracks'} 
        onClick={() => setActiveTab('tracks')}
        icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
        }
        label="Tracks"
        count={tracks.length}
        />
        <TabButton 
        active={activeTab === 'collabs'} 
        onClick={() => setActiveTab('collabs')}
        icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        }
        label="Collaborations"
        count={collaborations.length}
        />
    </div>

    {/* Tab Content */}
    <div className="min-h-[400px]">
        {activeTab === 'tracks' && (
        <TracksTab 
            tracks={tracks} 
            isOwnProfile={isOwnProfile}
            playingTrackId={playingTrackId}
            onPlayTrack={handlePlayTrack}
        />
        )}

        {activeTab === 'collabs' && (
        <CollaborationsTab collaborations={collaborations} />
        )}
    </div>
    </div>
</div>
);
}

// Tab Button Component
const TabButton = ({ active, onClick, icon, label, count }) => (
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
{count !== undefined && (
    <span className={`px-2 py-0.5 rounded-full text-xs ${
    active ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'
    }`}>
    {count}
    </span>
)}
</button>
);

// Tracks Tab (simplified)
const TracksTab = ({ tracks, isOwnProfile, playingTrackId, onPlayTrack }) => {
if (tracks.length === 0) {
return (
    <div className="text-center py-20 glass-panel rounded-3xl">
    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
    </div>
    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Tracks Yet</h3>
    <p className="text-[var(--text-secondary)] mb-4">
        {isOwnProfile 
        ? "Upload your first track to get started"
        : "This user hasn't uploaded any tracks yet"}
    </p>
    {isOwnProfile && (
        <Link 
        to="/upload" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
        >
        Upload Track
        </Link>
    )}
    </div>
);
}

return (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {tracks.map((track) => (
    <div key={track.id} className="group">
        <div className="glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all">
        {/* Track Header */}
        <div className="relative h-32 bg-gradient-to-br from-primary-600/20 to-primary-800/20">
            <button
            onClick={() => onPlayTrack(track.id)}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                {playingTrackId === track.id ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
                )}
            </div>
            </button>
        </div>

        {/* Track Info */}
        <div className="p-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-1">
            {track.title}
            </h3>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
            {track.bpm && (
                <span className="px-2 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300">
                {Math.round(track.bpm)} BPM
                </span>
            )}
            {track.genre && (
                <span className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)]">
                {track.genre}
                </span>
            )}
            </div>

            {/* Audio Player */}
            {playingTrackId === track.id && (
            <div className="mt-3 animate-slide-down">
                <audio
                controls
                autoPlay
                className="w-full h-8 rounded-lg"
                src={track.audio_url}
                onEnded={() => onPlayTrack(track.id)}
                />
            </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
            <Link
                to={`/tracks/${track.id}`}
                className="flex-1 text-center px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-all"
            >
                Details
            </Link>
            </div>
        </div>
        </div>
    </div>
    ))}
</div>
);
};

// Collaborations Tab (simplified)
const CollaborationsTab = ({ collaborations }) => {
if (collaborations.length === 0) {
return (
    <div className="text-center py-20 glass-panel rounded-3xl">
    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    </div>
    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Collaborations Yet</h3>
    <p className="text-[var(--text-secondary)]">This user hasn't collaborated on any tracks</p>
    </div>
);
}

return (
<div className="space-y-3">
    {collaborations.map((collab) => (
    <div key={collab.id} className="glass-panel p-4 rounded-xl hover:border-primary-500/50 transition-all">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            {collab.collaborator_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
            <h4 className="font-semibold text-[var(--text-primary)]">
                {collab.collaborator_name}
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
                on <span className="text-primary-400">"{collab.track_title}"</span>
            </p>
            </div>
        </div>
        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
            Active
        </span>
        </div>
    </div>
    ))}
</div>
);
};

export default ProfilePage;