import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import api from '../services/api';

const toSlug = (title) => title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

// ── Inline edit form ──────────────────────────────────────────────
function TrackEditForm({ track, onSave, onCancel }) {
const toast = useToast();
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({
title:          track.title || '',
description:    track.description || '',
genre:          track.genre || '',
desired_skills: Array.isArray(track.desired_skills) 
? track.desired_skills.join(', ')
: track.desired_skills || '',
});

const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

const handleSave = async () => {
if (!form.title.trim()) { toast.error('Title cannot be empty'); return; }
setSaving(true);
try {
    const res = await api.put(`/tracks/${track.id}`, {
    title:          form.title.trim(),
    description:    form.description.trim(),
    genre:          form.genre.trim(),
    desired_skills: form.desired_skills,
    });
    toast.success('Track updated ✓');
    onSave(res.data.track);
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to save changes');
} finally {
    setSaving(false);
}
};

const inputCls = [
'w-full px-3 py-2.5 rounded-xl text-sm',
'bg-[var(--bg-primary)] border border-[var(--border-color)]',
'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
'transition-[box-shadow,border-color]',
].join(' ');

return (
<div className="mt-4 p-4 bg-[var(--bg-primary)] border border-primary-500/30 rounded-xl space-y-3">
    <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">
    Editing track
    </p>

    <div>
    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Title *</label>
    <input
        type="text"
        value={form.title}
        onChange={set('title')}
        maxLength={100}
        className={inputCls}
        placeholder="Track title"
        disabled={saving}
    />
    </div>

    <div>
    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Description</label>
    <textarea
        value={form.description}
        onChange={set('description')}
        rows={3}
        maxLength={500}
        className={`${inputCls} resize-none`}
        placeholder="Describe your track, mood, inspiration..."
        disabled={saving}
    />
    <p className="text-xs text-[var(--text-tertiary)] text-right mt-0.5">
        {form.description.length}/500
    </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Genre</label>
        <input
        type="text"
        value={form.genre}
        onChange={set('genre')}
        maxLength={50}
        className={inputCls}
        placeholder="e.g. Trap, Lo-fi, House"
        disabled={saving}
        />
    </div>
    <div>
        <label className="block text-xs text-[var(--text-tertiary)] mb-1">
        Desired skills
        <span className="text-[var(--text-tertiary)] font-normal ml-1">(comma-separated)</span>
        </label>
        <input
        type="text"
        value={form.desired_skills}
        onChange={set('desired_skills')}
        className={inputCls}
        placeholder="e.g. vocals, mixing, guitar"
        disabled={saving}
        />
    </div>
    </div>

    <div className="flex gap-2 pt-1">
    <button
        onClick={handleSave}
        disabled={saving || !form.title.trim()}
        className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50
                    disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl
                    transition-[box-shadow,border-color]"
    >
        {saving ? 'Saving…' : 'Save changes'}
    </button>
    <button
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]
                    text-[var(--text-secondary)] text-sm rounded-xl border border-[var(--border-color)]
                    transition-[box-shadow,border-color]"
    >
        Cancel
    </button>
    </div>
</div>
);
}

// ── Main page ─────────────────────────────────────────────────────
function MyTracksPage() {
const toast    = useToast();
const confirm  = useConfirm();
const navigate = useNavigate();

const [tracks,           setTracks]           = useState([]);
const [loading,          setLoading]          = useState(true);
const [submissionCounts, setSubmissionCounts] = useState({});
const [collabCounts,     setCollabCounts]     = useState({});
const [editingId,        setEditingId]        = useState(null);

useEffect(() => { fetchMyTracks(); }, []);

const fetchMyTracks = async () => {
try {
    const response  = await api.get('/tracks/user/my-tracks');
    const trackList = response.data.tracks || [];
    setTracks(trackList);
    const counts  = {};
    const collabs = {};
    await Promise.allSettled(
    trackList.map(async (track) => {
        try {
        const subRes = await api.get(`/submissions/track/${track.id}`);
        counts[track.id] = subRes.data.submissions?.length || 0;
        } catch { counts[track.id] = 0; }
        try {
        const collabRes = await api.get(`/collaborations/track/${track.id}/active`);
        collabs[track.id] = collabRes.data.collaborators?.length || 0;
        } catch { collabs[track.id] = 0; }
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

const handleDelete = async (trackId) => {
const ok = await confirm({
    title: 'Delete track?',
    message: 'This action cannot be undone. All collaborations and submissions will be lost.',
    confirmText: 'Delete',
    danger: true,
});
if (!ok) return;
try {
    await api.delete(`/tracks/${trackId}`);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    toast.success('Track deleted');
} catch (err) {
    toast.error('Failed to delete track: ' + (err.response?.data?.error?.message || 'Server error'));
}
};

const handleReanalyze = async (trackId) => {
try {
    await api.post(`/tracks/${trackId}/reanalyze`);
    toast.success('Re-analysis started — this may take a minute');
    setTimeout(fetchMyTracks, 2000);
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to start re-analysis');
}
};

const handleSaveEdit = (updatedTrack) => {
setTracks((prev) =>
    prev.map((t) =>
    t.id === updatedTrack.id
        ? { ...t,
            title:          updatedTrack.title,
            description:    updatedTrack.description,
            genre:          updatedTrack.genre,
            desired_skills: updatedTrack.desired_skills }
        : t
    )
);
setEditingId(null);
};

if (loading) return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
        className="inline-flex items-center gap-2 px-5 py-3
                    bg-gradient-to-r from-primary-600 to-primary-500
                    hover:from-primary-500 hover:to-primary-400
                    text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20"
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
        <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-[box-shadow,border-color]">
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
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                    <Link to={`/tracks/${toSlug(track.title)}`}>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] hover:text-primary-400 truncate mb-2">
                        {track.title}
                    </h3>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        track.status === 'active'
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : track.status === 'completed'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                        {track.status === 'active' ? '🟢 Active' : track.status === 'completed' ? '✅ Completed' : track.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        track.analysis_status === 'completed'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                    }`}>
                        {track.analysis_status === 'completed' ? '🎵 Analyzed' : '⏳ Analyzing...'}
                    </span>
                    {track.analysis_status !== 'completed' && (
                        <button
                        onClick={() => handleReanalyze(track.id)}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10
                                    text-primary-400 border border-primary-500/30
                                    hover:bg-primary-500/20 transition-[box-shadow,border-color]"
                        >
                        🔄 Re-analyze
                        </button>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs text-[var(--text-tertiary)] border border-[var(--border-color)]">
                        {new Date(track.created_at).toLocaleDateString()}
                    </span>
                    </div>
                </div>

                {/* Actions: view / edit / delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                    to={`/tracks/${toSlug(track.title)}`}
                    title="View track"
                    className="p-2 text-[var(--text-secondary)] hover:text-primary-400
                                hover:bg-primary-500/10 rounded-lg transition-[box-shadow,border-color]"
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    </Link>

                    {/* Edit pencil — hidden on completed tracks */}
                    {track.status !== 'completed' && (
                    <button
                        onClick={() => setEditingId(editingId === track.id ? null : track.id)}
                        title={editingId === track.id ? 'Cancel edit' : 'Edit track info'}
                        className={`p-2 rounded-lg transition-[box-shadow,border-color] ${
                        editingId === track.id
                            ? 'text-primary-400 bg-primary-500/10'
                            : 'text-[var(--text-secondary)] hover:text-primary-400 hover:bg-primary-500/10'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    )}

                    <button
                    onClick={() => handleDelete(track.id)}
                    title="Delete track"
                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500
                                hover:bg-red-500/10 rounded-lg transition-[box-shadow,border-color]"
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    </button>
                </div>
                </div>

                {/* MIR stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'BPM',    value: track.bpm ? Math.round(track.bpm) : '—' },
                    { label: 'Energy', value: track.energy_level || '—', capitalize: true },
                    { label: 'Genre',  value: track.genre || '—' },
                    { label: 'Key',    value: track.musical_key || '—' },
                ].map(({ label, value, capitalize }) => (
                    <div key={label} className="bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
                    <p className={`text-base font-bold text-[var(--text-primary)] ${capitalize ? 'capitalize' : ''}`}>
                        {value}
                    </p>
                    </div>
                ))}
                </div>

                {/* Waveform player — replaces raw <audio> tag */}
                {track.audio_url && (
                <div className="mb-4">
                    <WaveformPlayer audioUrl={track.audio_url} height={56} />
                </div>
                )}

                {/* Inline edit form */}
                {editingId === track.id && (
                <TrackEditForm
                    track={track}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                />
                )}
            </div>

            {/* Bottom bar */}
            <div className="px-6 py-3 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-color)]
                            flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                <Link
                    to={`/tracks/${toSlug(track.title)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)]
                                hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400
                                rounded-lg text-sm font-medium transition-[box-shadow,border-color]
                                border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Track Details
                </Link>

                <Link
                    to={`/tracks/${toSlug(track.title)}/submissions`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)]
                                hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-400
                                rounded-lg text-sm font-medium transition-[box-shadow,border-color]
                                border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Submissions
                    {submissionCounts[track.id] > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {submissionCounts[track.id]}
                    </span>
                    )}
                </Link>

                <Link
                    to="/collaborations"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)]
                                hover:bg-green-500/10 text-[var(--text-secondary)] hover:text-green-400
                                rounded-lg text-sm font-medium transition-[box-shadow,border-color]
                                border border-[var(--border-color)]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Collaborators
                    {collabCounts[track.id] > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                        {collabCounts[track.id]}
                    </span>
                    )}
                </Link>
                </div>

                <button
                onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tracks/${toSlug(track.title)}`);
                    toast.info('Track link copied!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[var(--text-tertiary)]
                            hover:text-[var(--text-secondary)] rounded-lg text-sm
                            transition-[box-shadow,border-color]"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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