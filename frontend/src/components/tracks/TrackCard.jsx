import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function TrackCard({ track }) {
const [requesting, setRequesting] = useState(false);
const [showMessageInput, setShowMessageInput] = useState(false);
const [collabMessage, setCollabMessage] = useState('');
const [requestSent, setRequestSent] = useState(false);
const [showFullDescription, setShowFullDescription] = useState(false);
const [submissionsCount, setSubmissionsCount] = useState(null);
const { user } = useAuth();
const navigate = useNavigate();

const isOwner = user && track.user_id === user.id;
const isLoggedIn = !!user;

useEffect(() => {
// Fetch submission count for owner tracks to show badge
if (isOwner) {
    api.get(`/submissions/track/${track.id}`)
    .then(res => setSubmissionsCount(res.data.submissions?.length || 0))
    .catch(() => setSubmissionsCount(0));
}
}, [track.id, isOwner]);

const handleRequestClick = () => {
if (!isLoggedIn) {
    navigate('/login');
    return;
}
setShowMessageInput(true);
};

const requestCollaboration = async () => {
if (!collabMessage.trim()) {
    alert('Please add a short message to introduce yourself');
    return;
}
setRequesting(true);
try {
    await api.post('/collaborations/request', {
    track_id: track.id,
    message: collabMessage.trim(),
    });
    setRequestSent(true);
    setShowMessageInput(false);
} catch (err) {
    alert(err.response?.data?.error?.message || 'Failed to send request');
} finally {
    setRequesting(false);
}
};

const getEnergyColor = (level) => {
switch (level?.toLowerCase()) {
    case 'high': return 'bg-red-500/10 border-red-500/30 text-red-300';
    case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    case 'low': return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    default: return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
}
};

const formatDuration = (seconds) => {
if (!seconds) return '';
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
<div className={`glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-500 group music-card hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/20 animate-fade-in ${isOwner ? 'border-primary-500/30' : ''}`}>
    {isOwner && <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-primary-400"></div>}

    <div className="p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link to={`/tracks/${track.id}`}>
            <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
                {track.title}
            </h3>
            </Link>
            {isOwner && (
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                YOUR TRACK
            </span>
            )}
        </div>

        <Link
            to={`/profile/${track.user_id}`}
            className="text-sm text-[var(--text-secondary)] hover:text-primary-400 transition-colors inline-flex items-center gap-1"
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            @{track.username}
        </Link>

        {track.description && (
            <div className="mt-2">
            <p className={`text-sm text-[var(--text-tertiary)] transition-all ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                {track.description}
            </p>
            {track.description.length > 100 && (
                <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-primary-400 hover:text-primary-300 mt-1 transition-colors"
                >
                {showFullDescription ? 'Show less' : 'Read more'}
                </button>
            )}
            </div>
        )}
        </div>

        {/* Music icon + submissions badge for owners */}
        <div className="relative flex-shrink-0">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center border-2 border-primary-500/30 group-hover:border-primary-500/50 transition-all">
            <svg className="w-8 h-8 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
        </div>
        {isOwner && submissionsCount !== null && submissionsCount > 0 && (
            <Link
            to={`/tracks/${track.id}/submissions`}
            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold hover:bg-blue-400 transition-colors"
            title={`${submissionsCount} submission${submissionsCount !== 1 ? 's' : ''}`}
            >
            {submissionsCount}
            </Link>
        )}
        </div>
    </div>

    {/* MIR Tags */}
    <div className="flex flex-wrap gap-2 mb-4">
        {track.bpm && (
        <span className="px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300 font-medium">
            {Math.round(track.bpm)} BPM
        </span>
        )}
        {track.energy_level && (
        <span className={`px-3 py-1.5 border rounded-full text-xs font-medium capitalize ${getEnergyColor(track.energy_level)}`}>
            {track.energy_level} Energy
        </span>
        )}
        {track.musical_key && (
        <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-300 font-medium">
            {track.musical_key}
        </span>
        )}
        {track.genre && (
        <span className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
            {track.genre}
        </span>
        )}
    </div>

    {/* Desired Skills */}
    {track.desired_skills && track.desired_skills.length > 0 && (
        <div className="mb-4 p-3 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">Looking for:</p>
        <div className="flex flex-wrap gap-1.5">
            {track.desired_skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2.5 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full border border-primary-500/20">
                {skill}
            </span>
            ))}
            {track.desired_skills.length > 3 && (
            <span className="px-2.5 py-1 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs rounded-full border border-[var(--border-color)]">
                +{track.desired_skills.length - 3} more
            </span>
            )}
        </div>
        </div>
    )}

    {/* Audio Player */}
    <div className="relative mb-4">
        <audio
        controls
        className="w-full h-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
        style={{ filter: 'invert(1) hue-rotate(180deg)' }}
        src={track.audio_url}
        />
    </div>

    {/* Collab message input (shown when requesting) */}
    {showMessageInput && (
        <div className="mb-3 animate-slide-down">
        <textarea
            value={collabMessage}
            onChange={(e) => setCollabMessage(e.target.value)}
            placeholder={`Tell @${track.username} why you'd like to collaborate and what you can bring...`}
            className="w-full px-3 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-[var(--text-tertiary)]"
            rows={3}
            maxLength={300}
        />
        <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-[var(--text-tertiary)]">{collabMessage.length}/300</span>
            <button
            onClick={() => { setShowMessageInput(false); setCollabMessage(''); }}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
            Cancel
            </button>
        </div>
        </div>
    )}

    {/* Action Buttons */}
    {isOwner ? (
        <div className="flex gap-2">
        <Link
            to={`/tracks/${track.id}`}
            className="flex-1 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold rounded-xl text-center border border-[var(--border-color)] hover:border-primary-500/50 hover:text-primary-400 transition-all text-sm flex items-center justify-center gap-1.5"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Details
        </Link>
        <Link
            to={`/tracks/${track.id}/submissions`}
            className="flex-1 py-2.5 bg-blue-500/10 text-blue-400 font-semibold rounded-xl text-center border border-blue-500/30 hover:bg-blue-500/20 transition-all text-sm flex items-center justify-center gap-1.5"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Submissions
            {submissionsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full leading-none">
                {submissionsCount}
            </span>
            )}
        </Link>
        </div>
    ) : requestSent ? (
        <div className="w-full py-3 bg-green-500/10 border border-green-500/30 text-green-400 font-semibold rounded-xl text-center text-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Request Sent!
        <Link to="/collaborations" className="underline hover:no-underline ml-1">View →</Link>
        </div>
    ) : showMessageInput ? (
        <button
        onClick={requestCollaboration}
        disabled={requesting || !collabMessage.trim()}
        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
        >
        {requesting ? (
            <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
            </>
        ) : (
            <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Request
            </>
        )}
        </button>
    ) : (
        <div className="flex gap-2">
        <Link
            to={`/tracks/${track.id}`}
            className="px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium rounded-xl border border-[var(--border-color)] hover:border-primary-500/50 hover:text-primary-400 transition-all text-sm flex items-center justify-center"
            title="View track details"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        </Link>
        <button
            onClick={handleRequestClick}
            disabled={!isLoggedIn}
            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
            {!isLoggedIn ? (
            <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Login to Collaborate
            </>
            ) : (
            <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Request Collaboration
            </>
            )}
        </button>
        </div>
    )}
    </div>
</div>
);
}

export default TrackCard;