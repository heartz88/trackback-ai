import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../common/Toast';

function TrackCard({ track }) {
const toast = useToast();
const [requesting, setRequesting] = useState(false);
const [showFullDescription, setShowFullDescription] = useState(false);
const { user } = useAuth();

const requestCollaboration = async () => {
setRequesting(true);
try {
    const response = await api.post('/collaborations/request', {
        track_id: track.id,
        message: `I'd like to collaborate on "${track.title}"`
    });
    
    toast.success('Collaboration request sent!');
} catch (err) {
    console.error('Collaboration request error:', err);
    toast.error(err.response?.data?.error?.message || 'Failed to send request');
} finally {
    setRequesting(false);
}
};

const isOwner = user && track.user_id === user.id;
const isLoggedIn = !!user;

const formatDuration = (seconds) => {
if (!seconds) return '';
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getEnergyColor = (level) => {
switch(level?.toLowerCase()) {
    case 'high': return 'bg-red-500/10 border-red-500/30 text-red-300';
    case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    case 'low': return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    default: return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
}
};

return (
<div className={`
    glass-panel rounded-2xl overflow-hidden 
    hover:border-primary-500/50 transition-all duration-500 
    group music-card hover:scale-[1.02] hover:shadow-xl 
    hover:shadow-primary-500/20 animate-fade-in
    ${isOwner ? 'border-primary-500/30' : ''}
`}>
    {/* Header for owner tracks */}
    {isOwner && (
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-primary-400"></div>
    )}
    
    <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
                        {track.title}
                    </h3>
                    {isOwner && (
                        <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30 animate-pulse-glow">
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

            {/* Music Note Placeholder */}
            <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center border-2 border-primary-500/30 group-hover:border-primary-500/50 transition-all">
                    <svg className="w-8 h-8 text-primary-400 group-hover:text-primary-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                </div>
            </div>
        </div>

        {/* MIR Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
            {track.bpm && (
                <div className="px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300 font-medium">
                    {Math.round(track.bpm)} BPM
                </div>
            )}
            
            {track.energy_level && (
                <div className={`px-3 py-1.5 border rounded-full text-xs font-medium capitalize ${getEnergyColor(track.energy_level)}`}>
                    {track.energy_level} Energy
                </div>
            )}
            
            {track.musical_key && (
                <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-300 font-medium">
                    {track.musical_key}
                </div>
            )}
            
            {track.genre && (
                <div className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
                    {track.genre}
                </div>
            )}
            
            {track.duration && (
                <div className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
                    {formatDuration(track.duration)}
                </div>
            )}
        </div>

        {/* Desired Skills */}
        {track.desired_skills && track.desired_skills.length > 0 && (
            <div className="mb-4 p-3 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2 flex items-center gap-1">
                    Looking for collaborators that can contribute with:
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {track.desired_skills.slice(0, 3).map((skill, index) => (
                        <span 
                            key={index} 
                            className="px-2.5 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full border border-primary-500/20 hover:bg-primary-500/20 transition-all hover:scale-105 cursor-default"
                        >
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
        <div className="relative mb-4 group/audio">
            <audio
                controls
                className="w-full h-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                style={{
                    filter: 'invert(1) hue-rotate(180deg)',
                }}
                src={track.audio_url}
            >
                Your browser does not support audio playback.
            </audio>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transform scale-x-0 group-hover/audio:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Action Buttons */}
        {isOwner ? (
            <Link 
                to={`/tracks/${track.id}`}
                className="w-full py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold rounded-xl text-center border border-[var(--border-color)] hover:border-primary-500/50 hover:text-primary-400 transition-all flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                View Track Details
            </Link>
        ) : (
            <button
                onClick={requestCollaboration}
                disabled={requesting || !isLoggedIn}
                className={`
                    w-full py-3 font-semibold rounded-xl transition-all duration-300
                    flex items-center justify-center gap-2
                    ${!isLoggedIn 
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30'
                    }
                    ${requesting ? 'opacity-75 cursor-not-allowed' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transform hover:scale-[1.02] active:scale-[0.98]
                `}
            >
                {!isLoggedIn ? (
                    <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Login to Collaborate
                    </>
                ) : requesting ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Request...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Request Collaboration
                    </>
                )}
            </button>
        )}
    </div>
</div>
);
}

export default TrackCard;