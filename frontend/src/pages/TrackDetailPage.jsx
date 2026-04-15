import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import BackButton from '../components/common/BackButton';
import { useConfirm, useToast } from '../components/common/Toast';
import SubmissionList from '../components/submissions/SubmissionList';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TrackDetailPage = () => {
const { trackSlug } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const toast = useToast();
const confirm = useConfirm();

const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [requestingCollab, setRequestingCollab] = useState(false);
const [collaborators, setCollaborators] = useState([]);
const [submissionsCount, setSubmissionsCount] = useState(0);
const [collabMessage, setCollabMessage] = useState('');
const [showMessageInput, setShowMessageInput] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => { fetchTrackDetails(); }, [trackSlug]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const trackRes = await api.get(`/tracks/by-slug/${trackSlug}`);
    setTrack(trackRes.data.track);

    const ownerRes = await api.get(`/users/${trackRes.data.track.user_id}`);
    setOwner(ownerRes.data.user);

    try {
    const r = await api.get(`/submissions/track/${trackRes.data.track.id}`);
    setSubmissionsCount(r.data.submissions?.length || 0);
    } catch {
    setSubmissionsCount(0);
    }

    try {
    const r = await api.get(`/collaborations/track/${trackRes.data.track.id}/active`);
    setCollaborators(r.data.collaborators || []);
    } catch {
    setCollaborators([]);
    }

    if (user) {
    try {
        const r = await api.get(`/collaborations/track/${trackRes.data.track.id}`);
        setCollaboration(r.data.collaboration);
    } catch {
        setCollaboration(null);
    }
    }
} catch (err) {
    console.error('Failed to load track:', err);
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const handleRequestCollaboration = async () => {
if (!user) { navigate('/login'); return; }
if (!showMessageInput) { setShowMessageInput(true); return; }
setRequestingCollab(true);
try {
    const r = await api.post('/collaborations/request', {
    track_id: track.id,
    message: collabMessage || `I'd like to collaborate on "${track.title}"`,
    });
    setCollaboration(r.data.request);
    setShowMessageInput(false);
    toast.success('Collaboration request sent!');
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to send request');
} finally {
    setRequestingCollab(false);
}
};

const handleCompleteTrack = async () => {
const ok = await confirm({
    title: 'Mark track as completed?',
    message: 'The highest voted submission will be selected as the winning version. Collaborations will be closed and no new submissions can be made.',
    confirmText: 'Complete Track',
});
if (!ok) return;
try {
    await api.post(`/tracks/${track.id}/complete`);
    fetchTrackDetails();
    toast.success('Track marked as completed! 🎉');
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const handlePlay  = useCallback(() => setIsPlaying(true),  []);
const handlePause = useCallback(() => setIsPlaying(false), []);

// ── Derived state ──────────────────────────────────────────────
const isOwner         = user && track && user.id === track.user_id;
const isCompleted     = track?.status === 'completed';
const hasApprovedCollab = collaboration?.status === 'approved';

// A non-owner can only request if:
// - logged in, not the owner, no existing collab request, and track is NOT completed
const canRequestCollab = user && !isOwner && !collaboration && !isCompleted;

const energyClass = e =>
e === 'high'   ? 'tdp-tag tdp-tag-energy-high' :
e === 'medium' ? 'tdp-tag tdp-tag-energy-med'  :
                    'tdp-tag tdp-tag-energy-low';

// ── Loading / error states ─────────────────────────────────────
if (isLoading) return (
<div className="page-loading">
    <div className="music-loader">{[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}</div>
    <p style={{ color: 'var(--text-tertiary)', marginTop: 16 }} className="animate-pulse">Loading track…</p>
</div>
);

if (error || !track) return (
<div className="page-error animate-fade-in">
    <h2>Track Not Found</h2>
    <p>{error || 'This track does not exist'}</p>
    <Link to="/discover" className="btn-primary">Browse Tracks</Link>
</div>
);

return (
<div className="track-detail-page animate-fade-in">
    <div className="flex items-center gap-3 mb-4 animate-slide-up">
    <BackButton to="/discover" label="Discover" />
    <span className="breadcrumb-sep text-[var(--text-tertiary)]">›</span>
    <span className="text-sm text-[var(--text-secondary)] truncate">{track.title}</span>
    </div>

    <div className="tdp-player-block animate-slide-up stagger-1">
    <WaveformPlayer audioUrl={track.audio_url} height={80} onPlay={handlePlay} onPause={handlePause} />
    </div>

    <div className="tdp-grid">
    {/* ── Left: track info ────────────────────────────────── */}
    <div className="tdp-info animate-slide-up stagger-2">
        <div className="tdp-title-row">
        <h1 className="tdp-title">{track.title}</h1>
        {isPlaying && (
            <div className="eq-indicator" aria-label="Now playing">
            <span/><span/><span/><span/><span/>
            </div>
        )}
        {/* Completed badge */}
        {isCompleted && (
            <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
            background: 'rgba(20,184,166,0.12)', color: 'var(--accent-primary)',
            border: '1px solid rgba(20,184,166,0.35)',
            }}>
            ✅ Completed
            </span>
        )}
        </div>

        <div className="tdp-owner-row">
        <Link to={`/profile/${owner?.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Avatar user={owner} size={40} />
            <div>
            <div className="tdp-owner-name">@{owner?.username}</div>
            <div className="tdp-owner-date">{new Date(track.created_at).toLocaleDateString()}</div>
            </div>
        </Link>
        {user && !isOwner && owner && (
            <Link to={`/messages/${owner.username}`} className="tdp-message-btn">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Message
            </Link>
        )}
        </div>

        <div className="tdp-stats">
        {[{ l: 'Submissions', v: submissionsCount }, { l: 'Collaborators', v: collaborators.length }].map((s, idx) => (
            <div key={idx} className="tdp-stat">
            <span className="tdp-stat-value">{s.v}</span>
            <span className="tdp-stat-label">{s.l}</span>
            </div>
        ))}
        </div>

        <div className="tdp-tags">
        {track.bpm          && <span className="tdp-tag tdp-tag-bpm">{Math.round(track.bpm)} BPM</span>}
        {track.musical_key  && <span className="tdp-tag tdp-tag-key"> {track.musical_key}</span>}
        {track.energy_level && <span className={energyClass(track.energy_level)}>{track.energy_level}</span>}
        {track.genre        && <span className="tdp-tag tdp-tag-genre"> {track.genre}</span>}
        </div>

        {track.description && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">About</div>
        <p className="tdp-description">{track.description}</p>
        </>)}

        {track.desired_skills?.length > 0 && !isCompleted && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">🎯 Looking For</div>
        <div className="tdp-skills">
            {track.desired_skills.map((s, i) => <span key={i} className="tdp-skill">{s}</span>)}
        </div>
        </>)}
    </div>

    {/* ── Right: action panel ──────────────────────────────── */}
    <div className="tdp-actions-panel animate-slide-up stagger-3">
        <div className="tdp-action-card">

        {/* ── COMPLETED TRACK — everyone sees this ── */}
        {isCompleted && (
            <>
            <div className="section-label">🏆 This track has been completed</div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                The winning submission has been selected. You can still listen and leave comments.
            </p>
            <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>
                🏆 View Winning Submission
            </Link>
            </>
        )}

        {/* ── NOT COMPLETED ── */}
        {!isCompleted && (
            <>
            {/* Not logged in */}
            {!user && (
                <>
                <div className="section-label">Join the community</div>
                <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>👀 View Submissions & Vote</Link>
                <Link to="/login" className="btn-primary" style={{ textAlign: 'center' }}>🤝 Login to Collaborate</Link>
                </>
            )}

            {/* Can request collab */}
            {canRequestCollab && (
                <>
                <div className="section-label">What do you want to do?</div>
                <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>👀 View Submissions & Vote</Link>
                <hr className="tdp-divider"/>
                <div className="section-label" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Want to contribute?</div>
                {showMessageInput && (
                    <textarea
                    value={collabMessage}
                    onChange={e => setCollabMessage(e.target.value)}
                    placeholder={`Tell ${owner?.username} why you'd like to collaborate...`}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                    />
                )}
                <button onClick={handleRequestCollaboration} className="btn-primary" disabled={requestingCollab} style={{ width: '100%' }}>
                    {requestingCollab ? 'Sending…' : showMessageInput ? '🤝 Send Request' : '🤝 Request Collaboration'}
                </button>
                {showMessageInput && (
                    <button onClick={() => setShowMessageInput(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                    Cancel
                    </button>
                )}
                </>
            )}

            {/* Pending */}
            {collaboration?.status === 'pending' && (
                <>
                <div className="section-label">Your status</div>
                <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>👀 View Submissions & Vote</Link>
                <div className="tdp-status-pending">⏳ Collaboration Request Pending</div>
                </>
            )}

            {/* Rejected */}
            {collaboration?.status === 'rejected' && (
                <>
                <div className="section-label">Your status</div>
                <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>👀 View Submissions & Vote</Link>
                <div className="tdp-status-rejected">❌ Collaboration Declined</div>
                </>
            )}

            {/* Approved collaborator */}
            {collaboration?.status === 'approved' && (
                <>
                <div className="section-label">Your status</div>
                <div className="tdp-status-approved">✅ Collaboration Approved</div>
                <Link to={`/tracks/${trackSlug}/submissions`} className="btn-primary" style={{ textAlign: 'center' }}>➕ Submit Your Version</Link>
                {track.audio_url && (
                    <a href={track.audio_url} download target="_blank" rel="noreferrer" className="btn-secondary" style={{ textAlign: 'center' }}>⬇ Download Track</a>
                )}
                </>
            )}

            {/* Owner controls — only when NOT completed */}
            {isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="section-label">Your track</div>
                <Link to="/my-tracks" className="btn-secondary" style={{ textAlign: 'center' }}>✏️ Manage My Tracks</Link>
                {submissionsCount > 0 && (
                    <>
                    <Link to={`/tracks/${trackSlug}/submissions`} className="btn-secondary" style={{ textAlign: 'center' }}>
                        📋 Review Submissions ({submissionsCount})
                    </Link>
                    <button onClick={handleCompleteTrack} className="btn-primary" style={{ width: '100%' }}>
                        ✅ Mark as Completed
                    </button>
                    </>
                )}
                {submissionsCount === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                    You'll be able to complete this track once collaborators have submitted versions.
                    </p>
                )}
                </div>
            )}
            </>
        )}

        {/* Owner on completed track */}
        {isCompleted && isOwner && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
            <Link to="/my-tracks" className="btn-secondary" style={{ textAlign: 'center' }}>
                ✏️ Manage My Tracks
            </Link>
            </div>
        )}
        </div>

        {/* Collaborators list */}
        {collaborators.length > 0 && (
        <div className="tdp-action-card">
            <div className="section-label">🤝 Collaborators</div>
            <div className="tdp-collabs-list">
            {collaborators.map(collab => (
                <div key={collab.id} className="tdp-collab-item">
                <Link to={`/profile/${collab.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <Avatar user={collab} size={32} />
                    <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-primary-400 truncate">
                        @{collab.username}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">{collab.role || 'Collaborator'}</span>
                    </div>
                </Link>
                {user && user.id !== collab.id && (
                    <Link to={`/messages/${collab.username}`} className="tdp-message-btn flex-shrink-0" title="Message collaborator">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    </Link>
                )}
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    </div>

    {/* ── Submissions section ────────────────────────────────── */}
    <div className="tdp-submissions animate-slide-up stagger-4">
    <div className="tdp-section-head">
        <div>
        <h2 className="tdp-section-title">
            {isCompleted ? '🏆 Submissions' : '🏆 Submissions'}
        </h2>
        {/* Voting hint — only shown on open tracks to non-owners */}
        {!isCompleted && user && !isOwner && submissionsCount > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0', lineHeight: 1.4 }}>
            Like the submissions you enjoy — the most liked one wins
            </p>
        )}
        {isCompleted && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0', lineHeight: 1.4 }}>
            This track is complete — the winning submission is shown first
            </p>
        )}
        </div>
        {submissionsCount > 0 && (
        <Link to={`/tracks/${trackSlug}/submissions`} className="btn-view-all">
            View All ({submissionsCount}) →
        </Link>
        )}
    </div>

    <SubmissionList trackId={track.id} limit={3} />

    {submissionsCount === 0 && !isCompleted && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        No submissions yet.{' '}
        {hasApprovedCollab && (
            <Link to={`/tracks/${trackSlug}/submissions`} style={{ color: 'var(--accent-primary)' }}>
            Be the first!
            </Link>
        )}
        </div>
    )}
    </div>
</div>
);
};

export default TrackDetailPage;