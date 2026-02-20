import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function MyTracksPage() {
const [tracks, setTracks] = useState([]);
const [loading, setLoading] = useState(true);
const [submissionCounts, setSubmissionCounts] = useState({});
const [collabCounts, setCollabCounts] = useState({});
const [editingTrackId, setEditingTrackId] = useState(null);
const [metadataForms, setMetadataForms] = useState({});
const [savingId, setSavingId] = useState(null);
const navigate = useNavigate();

useEffect(() => {
fetchMyTracks();
}, []);

const fetchMyTracks = async () => {
try {
    const response = await api.get('/tracks/user/my-tracks');
    const trackList = response.data.tracks || [];
    setTracks(trackList);

    // Fetch submission and collab counts for each track
    const counts = {};
    const collabs = {};
    await Promise.allSettled(
    trackList.map(async (track) => {
        try {
        const subRes = await api.get(`/submissions/track/${track.id}`);
        counts[track.id] = subRes.data.submissions?.length || 0;
        } catch {
        counts[track.id] = 0;
        }
        try {
        const collabRes = await api.get(`/collaborations/track/${track.id}/active`);
        collabs[track.id] = collabRes.data.collaborators?.length || 0;
        } catch {
        collabs[track.id] = 0;
        }
    })
    );
    setSubmissionCounts(counts);
    setCollabCounts(collabs);
} catch (err) {
    console.error('Failed to fetch tracks:', err);
} finally {
    setLoading(false);
}
};

const openEditMetadata = (track) => {
setMetadataForms(prev => ({
    ...prev,
    [track.id]: {
    bpm: track.bpm ? Math.round(track.bpm) : '',
    musical_key: track.musical_key || '',
    energy_level: track.energy_level || '',
    genre: track.genre || '',
    }
}));
setEditingTrackId(track.id);
};

const handleSaveMetadata = async (trackId) => {
setSavingId(trackId);
const form = metadataForms[trackId];
try {
    const payload = {};
    if (form.bpm !== '') payload.bpm = form.bpm;
    if (form.musical_key !== '') payload.musical_key = form.musical_key;
    if (form.energy_level !== '') payload.energy_level = form.energy_level;
    if (form.genre !== '') payload.genre = form.genre;

    const res = await api.put(`/tracks/${trackId}/metadata`, payload);
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...res.data.track } : t));
    setEditingTrackId(null);
} catch (err) {
    alert(err.response?.data?.error?.message || 'Failed to save changes');
} finally {
    setSavingId(null);
}
};

const handleDelete = async (trackId) => {
if (!window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) return;
try {
    await api.delete(`/tracks/${trackId}`);
    setTracks(tracks.filter((t) => t.id !== trackId));
} catch (err) {
    alert('Failed to delete track: ' + (err.response?.data?.error?.message || 'Server error'));
}
};

if (loading) return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
</div>
);

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-10">
        <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">My Tracks</h1>
        <p className="text-[var(--text-secondary)]">Manage your uploaded music and collaborations</p>
        </div>
        <Link
        to="/upload"
        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload New
        </Link>
    </div>

    {tracks.length === 0 ? (
        <div className="text-center py-24 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border-color)]">
        <svg className="mx-auto h-16 w-16 text-[var(--text-tertiary)] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-[var(--text-secondary)] text-xl mb-2 font-semibold">No tracks yet</p>
        <p className="text-[var(--text-tertiary)] mb-6">Upload your first track to start finding collaborators</p>
        <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all">
            Upload your first track
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
        </div>
    ) : (
        <div className="space-y-5">
        {tracks.map((track) => (
            <div key={track.id} className="glass-panel rounded-2xl overflow-hidden hover:border-primary-500/40 transition-all">
            {/* Track Top Bar */}
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                    <Link to={`/tracks/${track.id}`}>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] hover:text-primary-400 transition-colors truncate mb-2">
                        {track.title}
                    </h3>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        track.status === 'active'
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : track.status === 'completed'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                        {track.status === 'active' ? '🟢 Active' : track.status === 'completed' ? '✅ Completed' : track.status}
                    </span>
                    {/* Analysis status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        track.analysis_status === 'completed'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                    }`}>
                        {track.analysis_status === 'completed' ? '🎵 Analyzed' : '⏳ Analyzing...'}
                    </span>
                    {/* Uploaded date */}
                    <span className="px-3 py-1 rounded-full text-xs text-[var(--text-tertiary)] border border-[var(--border-color)]">
                        {new Date(track.created_at).toLocaleDateString()}
                    </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                    to={`/tracks/${track.id}`}
                    title="View Track Details"
                    className="p-2 text-[var(--text-secondary)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    </Link>
                    <button
                    onClick={() => handleDelete(track.id)}
                    title="Delete Track"
                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    </button>
                </div>
                </div>

                {/* MIR Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'BPM', value: track.bpm ? Math.round(track.bpm) : '—' },
                    { label: 'Energy', value: track.energy_level || '—', capitalize: true },
                    { label: 'Genre', value: track.genre || '—' },
                    { label: 'Key', value: track.musical_key || '—' },
                ].map(({ label, value, capitalize }) => (
                    <div key={label} className="bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
                    <p className={`text-base font-bold text-[var(--text-primary)] ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                    </div>
                ))}
                </div>

                {/* Edit button */}
                {editingTrackId !== track.id && (
                <button
                    onClick={() => openEditMetadata(track)}
                    className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-primary-400 border border-[var(--border-color)] hover:border-primary-500/50 rounded-lg transition-all"
                >
                    ✏️ Correct AI values
                </button>
                )}

                {/* Inline metadata edit form */}
                {editingTrackId === track.id && metadataForms[track.id] && (
                <div className="mb-4 p-4 bg-[var(--bg-primary)] border border-primary-500/40 rounded-xl">
                    <p className="text-xs text-[var(--text-tertiary)] mb-3">Correct the AI-detected values. Leave blank to keep current.</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">BPM</label>
                        <input
                        type="number" min="20" max="400"
                        value={metadataForms[track.id].bpm}
                        onChange={e => setMetadataForms(prev => ({...prev, [track.id]: {...prev[track.id], bpm: e.target.value}}))}
                        placeholder={track.bpm ? Math.round(track.bpm) : 'e.g. 140'}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Energy</label>
                        <select
                        value={metadataForms[track.id].energy_level}
                        onChange={e => setMetadataForms(prev => ({...prev, [track.id]: {...prev[track.id], energy_level: e.target.value}}))}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary-500"
                        >
                        <option value="">Keep ({track.energy_level || '—'})</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Key</label>
                        <input
                        type="text"
                        value={metadataForms[track.id].musical_key}
                        onChange={e => setMetadataForms(prev => ({...prev, [track.id]: {...prev[track.id], musical_key: e.target.value}}))}
                        placeholder={track.musical_key || 'e.g. C# Minor'}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Genre</label>
                        <input
                        type="text"
                        value={metadataForms[track.id].genre}
                        onChange={e => setMetadataForms(prev => ({...prev, [track.id]: {...prev[track.id], genre: e.target.value}}))}
                        placeholder={track.genre || 'e.g. Hip Hop'}
                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    </div>
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleSaveMetadata(track.id)}
                        disabled={savingId === track.id}
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                        {savingId === track.id ? 'Saving…' : '✓ Save Changes'}
                    </button>
                    <button
                        onClick={() => setEditingTrackId(null)}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm rounded-lg border border-[var(--border-color)] transition-all"
                    >
                        Cancel
                    </button>
                    </div>
                </div>
                )}

                {/* Audio Player */}
                {track.audio_url && (
                <audio
                    controls
                    className="w-full rounded-lg h-10 mb-4"
                    style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                    src={track.audio_url}
                />
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-6 py-3 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-color)] flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                {/* View Details */}
                <Link
                    to={`/tracks/${track.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm font-medium transition-all border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Track Details
                </Link>

                {/* View Submissions */}
                <Link
                    to={`/tracks/${track.id}/submissions`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-400 rounded-lg text-sm font-medium transition-all border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Submissions
                    {submissionCounts[track.id] > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{submissionCounts[track.id]}</span>
                    )}
                </Link>

                {/* Collaborations */}
                <Link
                    to="/collaborations"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-green-500/10 text-[var(--text-secondary)] hover:text-green-400 rounded-lg text-sm font-medium transition-all border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Collaborators
                    {collabCounts[track.id] > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">{collabCounts[track.id]}</span>
                    )}
                </Link>
                </div>

                {/* Share link */}
                <button
                onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tracks/${track.id}`);
                    alert('Track link copied!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-lg text-sm transition-all"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
                </button>
            </div>
            </div>
        ))}
        </div>
    )}
    </div>
</div>
);
}

export default MyTracksPage;