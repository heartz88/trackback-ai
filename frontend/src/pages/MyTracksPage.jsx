import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function MyTracksPage() {
const [tracks, setTracks] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
const fetchMyTracks = async () => {
    try {
    const response = await api.get('/tracks/user/my-tracks');
    setTracks(response.data.tracks);
    } catch (err) {
    console.error('Failed to fetch tracks:', err);
    } finally {
    setLoading(false);
    }
};
fetchMyTracks();
}, []);

const handleDelete = async (trackId) => {
if (!window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
    return;
}

try {
    await api.delete(`/tracks/${trackId}`);
    setTracks(tracks.filter(track => track.id !== trackId));
} catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete track: ' + (err.response?.data?.error?.message || 'Server error'));
}
};

if (loading) return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center transition-colors duration-300">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
</div>
);

return (
<div className="min-h-screen bg-[var(--bg-primary)] px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
    <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">My Tracks</h1>
        <p className="text-[var(--text-secondary)]">Manage your uploaded music</p>
    </div>

    <div className="space-y-4">
        {tracks.map((track) => (
        <div key={track.id} className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{track.title}</h3>
                <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${track.status === 'active'
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                    {track.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${track.analysis_status === 'completed'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                    }`}>
                    {track.analysis_status === 'completed' ? 'Analyzed' : 'Analyzing...'}
                </span>
                </div>
            </div>

            <button
                onClick={() => handleDelete(track.id)}
                className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete Track"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 011.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">BPM</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{track.bpm || '—'}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Energy</p>
                <p className="text-lg font-bold text-[var(--text-primary)] capitalize">{track.energy_level || '—'}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Genre</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{track.genre || '—'}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Key</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{track.musical_key || '—'}</p>
            </div>
            </div>

            <audio
            controls
            className="w-full rounded-lg h-10"
            style={{
                filter: 'invert(1) hue-rotate(180deg)',
            }}
            src={track.audio_url}
            />
        </div>
        ))}

        {tracks.length === 0 && (
        <div className="text-center py-20 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
            <svg className="mx-auto h-16 w-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg mb-3">No tracks yet</p>
            <Link to="/upload" className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium">
            Upload your first track
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            </Link>
        </div>
        )}
    </div>
    </div>
</div>
);
}

export default MyTracksPage;