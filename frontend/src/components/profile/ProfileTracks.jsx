import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProfileTracks({ tracks, isOwnProfile }) {
const [playingTrackId, setPlayingTrackId] = useState(null);

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
        {isOwnProfile ? 'Upload your first track to get started' : "This user hasn't uploaded any tracks yet"}
    </p>
    {isOwnProfile && (
        <Link 
        to="/upload" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload Track
        </Link>
    )}
    </div>
);
}

return (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {tracks.map(track => (
    <div 
        key={track.id} 
        className="group glass-panel rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10"
    >
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
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-xl transform group">
            {playingTrackId === track.id ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
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
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-2 line-clamp-1 hover:text-primary-400 transition-colors">
            {track.title}
        </h3>
        
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
);
}