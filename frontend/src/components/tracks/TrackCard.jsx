import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

function TrackCard({ track }) {
const [requesting, setRequesting] = useState(false);
const { sendCollaborationRequest } = useSocket();

const requestCollaboration = async () => {
setRequesting(true);
try {
sendCollaborationRequest(track.id, `I'd like to collaborate on "${track.title}"`);

// Show success message
alert('Collaboration request sent! You can continue the conversation in Messages.');
} catch (err) {
alert('Request failed: ' + (err.response?.data?.error?.message || 'Unknown error'));
} finally {
setRequesting(false);
}
};

// Format duration
const formatDuration = (seconds) => {
if (!seconds) return '';
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
<div className="glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all group music-card hover:scale-[1.02] duration-300">
<div className="p-6">
<div className="flex items-start justify-between mb-4">
    <div className="flex-1">
    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-primary-400 transition-colors">
        {track.title}
    </h3>
    <p className="text-sm text-[var(--text-secondary)]">by {track.username}</p>
    {track.description && (
        <p className="text-sm text-[var(--text-tertiary)] mt-2 line-clamp-2">
        {track.description}
        </p>
    )}
    </div>
    <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center border border-primary-500/30">
    <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
    </svg>
    </div>
</div>

<div className="flex flex-wrap gap-2 mb-4">
    {track.bpm && (
    <div className="px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300 font-medium">
        {Math.round(track.bpm)} BPM
    </div>
    )}
    {track.energy_level && (
    <div className={`px-3 py-1.5 border rounded-full text-xs font-medium capitalize
        ${track.energy_level === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
        track.energy_level === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
        'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}>
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

{track.desired_skills && track.desired_skills.length > 0 && (
    <div className="mb-4">
    <p className="text-xs text-[var(--text-tertiary)] mb-2">Looking for:</p>
    <div className="flex flex-wrap gap-1">
        {track.desired_skills.slice(0, 3).map((skill, index) => (
        <span key={index} className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-full border border-primary-500/20">
            {skill}
        </span>
        ))}
        {track.desired_skills.length > 3 && (
        <span className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs rounded-full">
            +{track.desired_skills.length - 3} more
        </span>
        )}
    </div>
    </div>
)}

<audio
    controls
    className="w-full mb-4 h-10 rounded-lg"
    style={{
    filter: 'invert(1) hue-rotate(180deg)',
    }}
    src={track.audio_url}
>
    Your browser does not support audio playback.
</audio>

<button
    onClick={requestCollaboration}
    disabled={requesting}
    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none hover:shadow-xl hover:shadow-primary-500/30 duration-300"
>
    {requesting ? (
    <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending Request...
    </>
    ) : 'Request Collaboration'}
</button>
</div>
</div>
);
}

export default TrackCard;