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
if (profileId) fetchProfileData();
}, [profileId]);

const fetchProfileData = async () => {
setLoading(true);
try {
    const [profileRes, tracksRes, collabRes] = await Promise.allSettled([
    api.get(`/users/${profileId}`),
    api.get(`/tracks/user/${profileId}`),
    api.get(`/collaborations/user/${profileId}`),
    ]);

    if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.user);
    setTracks(tracksRes.status === 'fulfilled' ? tracksRes.value.data.tracks || [] : []);
    setCollaborations(collabRes.status === 'fulfilled' ? collabRes.value.data.collaborations || [] : []);
} catch (err) {
    console.error('Failed to fetch profile:', err);
} finally {
    setLoading(false);
}
};

const formatDate = (dateString) => {
if (!dateString) return '';
return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatLastActive = (dateString) => {
if (!dateString) return 'Unknown';
const date = new Date(dateString);
const diffInSeconds = Math.floor((Date.now() - date) / 1000);
if (diffInSeconds < 60) return 'Online now';
if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
return date.toLocaleDateString();
};

if (loading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="music-loader">
        {[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar"></span>)}
    </div>
    </div>
);
}

if (!profile) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center glass-panel p-12 rounded-3xl max-w-md">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Profile Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-6">The user you're looking for doesn't exist</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all">
        Go Home
        </Link>
    </div>
    </div>
);
}

return (
<div className="min-h-screen bg-[var(--bg-primary)]">
    {/* Banner */}
    <div className="relative h-48 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0,100 Q150,50 300,100 T600,100 T900,100 T1200,100" stroke="white" fill="none" strokeWidth="2" />
        </svg>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
    </div>

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
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-[var(--bg-primary)]" title="Open to collaborations">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                </div>
            )}
            </div>
        </div>

        {/* Info */}
        <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{profile.username}</h1>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] flex-wrap">
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Joined {formatDate(profile.created_at)}
                </span>
                <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full"></span>
                <span>Last active {formatLastActive(profile.last_active)}</span>
                {profile.looking_for_collab && (
                    <>
                    <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full"></span>
                    <span className="text-green-400 font-medium">✓ Open to collabs</span>
                    </>
                )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
                {isOwnProfile ? (
                <>
                    <Link to="/edit-profile" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] hover:text-primary-400 rounded-xl transition-all border border-[var(--border-color)] text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                    </Link>
                    <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all text-sm font-medium">
                    + Upload Track
                    </Link>
                </>
                ) : (
                currentUser && (
                    <Link to={`/messages/new?userId=${profile.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                    </Link>
                )
                )}
            </div>
            </div>

            {/* Bio */}
            {profile.bio && (
            <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">{profile.bio}</p>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-400 font-medium">
                    {skill}
                </span>
                ))}
            </div>
            )}
            {/* Preferred Genres */}
            {profile.preferred_genres?.length > 0 && (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Preferred Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                {profile.preferred_genres.map((genre, index) => (
                    <span
                    key={index}
                    className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm"
                    >
                    {genre}
                    </span>
                ))}
                </div>
            </div>
            )}

            {/* Equipment */}
            {profile.equipment?.length > 0 && (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Equipment / Software
                </h3>
                <div className="flex flex-wrap gap-2">
                {profile.equipment.map((item, index) => (
                    <span
                    key={index}
                    className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm"
                    >
                    {item}
                    </span>
                ))}
                </div>
            </div>
            )}

            {/* Looking For */}
            {profile.looking_for && (
            <div className="mb-6 p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Looking For
                </h3>
                <p className="text-[var(--text-primary)]">{profile.looking_for}</p>
            </div>
            )}

            {/* Social Links */}
            {profile.social_links && Object.values(profile.social_links).some(v => v) && (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Connect
                </h3>
                <div className="flex flex-wrap gap-3">
                {profile.social_links.instagram && (
                    <a
                    href={`https://instagram.com/${profile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="Instagram"
                    >
                    <img
                        src="https://cdn.simpleicons.org/instagram/ffffff"
                        className="w-5 h-5"
                        alt="Instagram"
                    />
                    </a>
                )}
                {profile.social_links.twitter && (
                    <a
                    href={`https://twitter.com/${profile.social_links.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="Twitter/X"
                    >
                    <img
                        src="https://cdn.simpleicons.org/x/ffffff"
                        className="w-5 h-5"
                        alt="X"
                    />
                    </a>
                )}
                {profile.social_links.soundcloud && (
                    <a
                    href={profile.social_links.soundcloud.startsWith('http') ? profile.social_links.soundcloud : `https://${profile.social_links.soundcloud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="SoundCloud"
                    >
                    <img
                        src="https://cdn.simpleicons.org/soundcloud/ffffff"
                        className="w-5 h-5"
                        alt="SoundCloud"
                    />
                    </a>
                )}
                {profile.social_links.spotify && (
                    <a
                    href={profile.social_links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="Spotify"
                    >
                    <img
                        src="https://cdn.simpleicons.org/spotify/ffffff"
                        className="w-5 h-5"
                        alt="Spotify"
                    />
                    </a>
                )}
                {profile.social_links.youtube && (
                    <a
                    href={profile.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="YouTube"
                    >
                    <img
                        src="https://cdn.simpleicons.org/youtube/ffffff"
                        className="w-5 h-5"
                        alt="YouTube"
                    />
                    </a>
                )}
                
                {profile.social_links.discord && (
                <a
                    href={profile.social_links.discord.startsWith('https') ? profile.social_links.discord : `https://discord.com/users/${profile.social_links.discord}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="Discord"
                >
                    <img
                        src="https://cdn.simpleicons.org/discord/ffffff"
                        className="w-5 h-5"
                        alt="Discord"
                    />
                </a>
            )}
            {profile.social_links.tiktok && (
                <a
                    href={`https://tiktok.com/@${profile.social_links.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-black rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                    title="TikTok"
                >
                    <img
                        src="https://cdn.simpleicons.org/tiktok/ffffff"
                        className="w-5 h-5"
                        alt="TikTok"
                    />
                </a>
            )}
                </div>
            </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
            <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{tracks.length}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Tracks</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{collaborations.length}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Collabs</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                {tracks.reduce((sum, t) => sum + (t.plays || 0), 0)}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">Plays</div>
            </div>
            </div>
        </div>
        </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
        {[
        { id: 'tracks', label: 'Tracks', count: tracks.length },
        { id: 'collabs', label: 'Collaborations', count: collaborations.length },
        ].map((tab) => (
        <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
        >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'}`}>
            {tab.count}
            </span>
        </button>
        ))}
    </div>

    {/* Tracks Tab */}
    {activeTab === 'tracks' && (
        tracks.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Tracks Yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">
            {isOwnProfile ? 'Upload your first track to get started' : 'This user hasn\'t uploaded any tracks yet'}
            </p>
            {isOwnProfile && (
            <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all">
                Upload Track
            </Link>
            )}
        </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
            <div key={track.id} className="group glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all">
                <div className="relative h-28 bg-gradient-to-br from-primary-600/20 to-primary-800/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {playingTrackId === track.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <audio
                        controls
                        autoPlay
                        className="w-full h-8 px-2"
                        src={track.audio_url}
                        onEnded={() => setPlayingTrackId(null)}
                    />
                    </div>
                )}
                <button
                    onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-xl">
                    {playingTrackId === track.id ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                    </div>
                </button>
                </div>

                <div className="p-4">
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2 line-clamp-1">{track.title}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {track.bpm && (
                    <span className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300">
                        {Math.round(track.bpm)} BPM
                    </span>
                    )}
                    {track.genre && (
                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)]">
                        {track.genre}
                    </span>
                    )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
                    <Link
                    to={`/tracks/${track.id}`}
                    className="flex-1 text-center px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-all"
                    >
                    Details
                    </Link>
                    <Link
                    to={`/tracks/${track.id}/submissions`}
                    className="flex-1 text-center px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-400 rounded-lg text-sm transition-all"
                    >
                    Submissions
                    </Link>
                </div>
                </div>
            </div>
            ))}
        </div>
        )
    )}

    {/* Collabs Tab */}
    {activeTab === 'collabs' && (
        collaborations.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Collaborations Yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">
            {isOwnProfile ? 'Explore tracks to find collaboration opportunities' : 'This user hasn\'t collaborated yet'}
            </p>
            {isOwnProfile && (
            <Link to="/discover" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all">
                Discover Tracks
            </Link>
            )}
        </div>
        ) : (
        <div className="space-y-3">
            {collaborations.map((collab) => (
            <div key={collab.id} className="glass-panel p-4 rounded-xl hover:border-primary-500/50 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link to={`/profile/${collab.collaborator_id || collab.owner_id}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform">
                        {collab.collaborator_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    </Link>
                    <div>
                    <Link to={`/profile/${collab.collaborator_id}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-400 transition-colors text-sm">
                        {collab.collaborator_name}
                    </Link>
                    <p className="text-xs text-[var(--text-secondary)]">
                        on{' '}
                        <Link to={`/tracks/${collab.track_id}`} className="text-primary-400 hover:text-primary-300 font-medium">
                        "{collab.track_title}"
                        </Link>
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                    to={`/tracks/${collab.track_id}/submissions`}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all"
                    >
                    View Submissions
                    </Link>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                    {collab.status || 'Active'}
                    </span>
                </div>
                </div>
            </div>
            ))}
        </div>
        )
    )}
    </div>
</div>
);
}

export default ProfilePage;