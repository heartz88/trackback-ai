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
const [activeTab, setActiveTab] = useState('tracks');
const [playingTrackId, setPlayingTrackId] = useState(null);

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

const handlePlayTrack = (trackId) => {
    if (playingTrackId === trackId) {
        setPlayingTrackId(null);
    } else {
        setPlayingTrackId(trackId);
    }
};

if (loading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="music-loader">
            <span className="music-loader-bar" />
            <span className="music-loader-bar" />
            <span className="music-loader-bar" />
            <span className="music-loader-bar" />
            <span className="music-loader-bar" />
        </div>
    </div>
);
}

if (!profile) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center glass-panel p-12 rounded-3xl">
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
<div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
    {/* Hero Section with Waveform Background */}
    <div className="relative h-72 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 overflow-hidden">
        {/* Animated waveform pattern background */}
        <div className="absolute inset-0 opacity-20">
            <div className="flex items-end justify-center h-full gap-1 px-4">
                {[...Array(100)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1 bg-white rounded-full animate-waveform"
                        style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.02}s`,
                        }}
                    />
                ))}
            </div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
    </div>

    {/* Profile Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-16 relative z-10">
        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-8 mb-8 backdrop-blur-xl border border-white/10">
            <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Avatar Section */}
                <div className="relative">
                    <div className="w-36 h-36 lg:w-40 lg:h-40 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-2xl border-4 border-white/20 ring-4 ring-primary-500/30">
                        {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    {/* Online Status */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[var(--bg-primary)] flex items-center justify-center">
                    </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-2">
                                {profile.username}
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)] flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                {profile.email}
                            </p>
                        </div>
                        {/* Action Buttons */}
                        {isOwnProfile ? (
                            <Link
                                to="/edit-profile"
                                className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profile
                            </Link>
                        ) : (
                            <Link
                                to={`/messages/new?userId=${profile.id}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Send Message
                            </Link>
                        )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div className="mb-6 p-4 bg-[var(--bg-tertiary)]/50 rounded-xl border border-[var(--border-color)]">
                            <p className="text-[var(--text-secondary)]">
                                "{profile.bio}"
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4 text-center border border-[var(--border-color)]">
                            <div className="text-2xl font-bold text-primary-400">{tracks.length}</div>
                            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Tracks</div>
                        </div>
                        <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4 text-center border border-[var(--border-color)]">
                            <div className="text-2xl font-bold text-primary-400">{activeCollabs.length}</div>
                            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Active Collabs</div>
                        </div>
                    </div>

                    {/* Skills/Tags */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                                Skills & Expertise
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-primary-500/10 text-primary-400 border 
                                        border-primary-500/30 rounded-full text-sm font-medium
                                        hover:bg-primary-500/20 transition-all cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-3 mb-8 border-b border-[var(--border-color)] pb-4">
            <button
                onClick={() => setActiveTab('tracks')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'tracks'
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Tracks
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{tracks.length}</span>
            </button>
            <button
                onClick={() => setActiveTab('collabs')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'collabs'
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Collaborations
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{activeCollabs.length}</span>
            </button>
            <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'about'
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tracks' && (
            <div>
                {tracks.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl">
                        <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No Tracks Yet</h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                            {isOwnProfile 
                                ? "Share your music with the community by uploading your first track"
                                : "This user hasn't uploaded any tracks yet"}
                        </p>
                        {isOwnProfile && (
                            <Link 
                                to="/upload" 
                                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/30"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload Your First Track
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tracks.map((track) => (
                            <div key={track.id} className="group relative">
                                {/* Track Card */}
                                <div className="glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10">
                                    {/* Track Art/Header */}
                                    <div className="relative h-40 bg-gradient-to-br from-primary-600/20 to-primary-800/20">
                                        {/* Waveform Preview */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <div className="flex items-end gap-0.5 h-16">
                                                {[...Array(40)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 bg-primary-400 rounded-full animate-waveform"
                                                        style={{
                                                            height: `${Math.random() * 60 + 20}%`,
                                                            animationDelay: `${i * 0.05}s`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Play Button Overlay */}
                                        <button
                                            onClick={() => handlePlayTrack(track.id)}
                                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                                                {playingTrackId === track.id ? (
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Track Info */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors mb-1">
                                                    {track.title}
                                                </h3>
                                                <p className="text-sm text-[var(--text-tertiary)]">
                                                    Uploaded {new Date(track.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Track Tags */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {track.bpm && (
                                                <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300 font-medium">
                                                    🎵 {Math.round(track.bpm)} BPM
                                                </span>
                                            )}
                                            {track.energy_level && (
                                                <span className={`px-3 py-1 border rounded-full text-xs font-medium capitalize ${
                                                    track.energy_level === 'high'
                                                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                                        : track.energy_level === 'medium'
                                                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                                                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                                }`}>
                                                    {track.energy_level}
                                                </span>
                                            )}
                                            {track.genre && (
                                                <span className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
                                                    {track.genre}
                                                </span>
                                            )}
                                            {track.musical_key && (
                                                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300 font-medium">
                                                    {track.musical_key}
                                                </span>
                                            )}
                                        </div>

                                        {/* Audio Player (shown when playing) */}
                                        {playingTrackId === track.id && (
                                            <div className="mt-4 animate-slide-down">
                                                <audio
                                                    controls
                                                    autoPlay
                                                    className="w-full rounded-lg"
                                                    src={track.audio_url}
                                                    onEnded={() => setPlayingTrackId(null)}
                                                />
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
                                            <Link
                                                to={`/tracks/${track.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Details
                                            </Link>
                                            {!isOwnProfile && (
                                                <Link
                                                    to={`/messages/new?trackId=${track.id}`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    Collaborate
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'collabs' && (
            <div>
                {activeCollabs.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl">
                        <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No Active Collaborations</h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                            {isOwnProfile 
                                ? "Start collaborating with other artists to create amazing music together"
                                : "This user isn't currently collaborating on any tracks"}
                        </p>
                        {isOwnProfile && (
                            <Link 
                                to="/discover" 
                                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Discover Tracks
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeCollabs.map((collab) => (
                            <div key={collab.id} className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                                {collab.collaborator_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                                                {collab.collaborator_name}
                                            </h4>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                Collaborating on <span className="text-primary-400 font-medium">"{collab.track_title}"</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Active
                                        </span>
                                        <Link
                                            to={`/messages?collab=${collab.id}`}
                                            className="p-3 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-xl transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'about' && (
            <div className="glass-panel p-8 rounded-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bio */}
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                About Me
                            </h3>
                            <p className="text-[var(--text-primary)] text-lg leading-relaxed">
                                {profile.bio || 'No bio provided yet.'}
                            </p>
                        </div>

                        {/* Looking For */}
                        {profile.looking_for && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Looking For
                                </h3>
                                <p className="text-[var(--text-primary)]">{profile.looking_for}</p>
                            </div>
                        )}

                        {/* Preferred Genres */}
                        {profile.preferred_genres && profile.preferred_genres.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                    Preferred Genres
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.preferred_genres.map((genre, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm font-medium text-[var(--text-primary)] hover:border-primary-500/30 transition-all"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Quick Info */}
                    <div className="space-y-6">
                        {/* Member Info Card */}
                        <div className="bg-[var(--bg-tertiary)]/30 rounded-2xl p-6 border border-[var(--border-color)]">
                            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                Member Info
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-tertiary)]">Joined</p>
                                        <p className="text-[var(--text-primary)] font-medium">{formatDate(profile.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-tertiary)]">Email</p>
                                        <p className="text-[var(--text-primary)] font-medium break-all">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-tertiary)]">Total Collaborations</p>
                                        <p className="text-[var(--text-primary)] font-medium">{activeCollabs.length} Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {!isOwnProfile && (
                            <div className="bg-[var(--bg-tertiary)]/30 rounded-2xl p-6 border border-[var(--border-color)]">
                                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <Link
                                        to={`/messages/new?userId=${profile.id}`}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Send Message
                                    </Link>
                                    <Link
                                        to={`/discover?collabWith=${profile.id}`}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 font-semibold rounded-xl transition-all border border-[var(--border-color)]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Find Similar Artists
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
</div>
);
}

export default ProfilePage;