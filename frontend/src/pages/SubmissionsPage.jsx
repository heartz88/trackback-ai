import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import SubmissionCard from '../components/submissions/SubmissionCard';
import SubmissionForm from '../components/submissions/SubmissionForm';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SubmissionsPage = () => {
const { trackId } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const toast = useToast();
const confirm = useConfirm();

const [track, setTrack]                   = useState(null);
const [owner, setOwner]                   = useState(null);
const [collaboration, setCollaboration]   = useState(null);
const [submissions, setSubmissions]       = useState([]);
const [showSubmitForm, setShowSubmitForm] = useState(false);
const [isLoading, setIsLoading]           = useState(true);
const [submissionsLoading, setSubmissionsLoading] = useState(true);
const [error, setError]                   = useState('');
const [refreshKey, setRefreshKey]         = useState(0);
const [isPlaying, setIsPlaying]           = useState(false);

// Derived stats — computed from local submissions array
const totalVotes    = submissions.reduce((acc, s) => acc + (s.upvotes || 0) + (s.downvotes || 0), 0);
const topSubmission = submissions.length > 0
? submissions.reduce((best, s) =>
    ((s.upvotes || 0) - (s.downvotes || 0)) > ((best.upvotes || 0) - (best.downvotes || 0)) ? s : best
    )
: null;
const topScore = topSubmission ? Math.max(0, (topSubmission.upvotes || 0) - (topSubmission.downvotes || 0)) : 0;

useEffect(() => { fetchTrackDetails(); fetchCollaboration(); }, [trackId]);
useEffect(() => { fetchSubmissions(); }, [trackId, refreshKey, user]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const res = await api.get(`/tracks/${trackId}`);
    setTrack(res.data.track);
    try {
    const ownerRes = await api.get(`/users/${res.data.track.user_id}`);
    setOwner(ownerRes.data.user);
    } catch {}
} catch {
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const fetchCollaboration = async () => {
if (!user) return;
try {
    const res = await api.get(`/collaborations/track/${trackId}`);
    if (res.data.collaboration) setCollaboration(res.data.collaboration);
} catch {}
};

const fetchSubmissions = async () => {
if (!user) { setSubmissionsLoading(false); return; }
setSubmissionsLoading(true);
try {
    // /collaborations/:trackId/submissions returns track_owner_id on each row,
    // which VoteButton needs to correctly block owner voting client-side
    const res = await api.get(`/collaborations/${trackId}/submissions`);
    setSubmissions(res.data.submissions || []);
} catch {
    // Fallback for non-collaborators who can still see a public list
    try {
    const res = await api.get(`/submissions/track/${trackId}`);
    setSubmissions(res.data.submissions || []);
    } catch {
    setSubmissions([]);
    }
} finally {
    setSubmissionsLoading(false);
}
};

const handleSubmissionSuccess = () => {
setShowSubmitForm(false);
setRefreshKey(k => k + 1);
toast.success('Submission uploaded! 🎵');
};

const handleCompleteTrack = async () => {
const ok = await confirm({
    title: 'Mark as completed?',
    message: 'The highest voted submission will be selected as the final version.',
    confirmText: 'Complete Track',
});
if (!ok) return;
try {
    await api.post(`/collaborations/${trackId}/complete`);
    toast.success('Track marked as completed!');
    navigate(`/tracks/${trackId}`);
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const handlePlay  = useCallback(() => setIsPlaying(true),  []);
const handlePause = useCallback(() => setIsPlaying(false), []);

const isOwner   = user && track && user.id === track.user_id;
const canSubmit = collaboration?.status === 'approved';

const energyClass = e =>
e === 'high'   ? 'tdp-tag tdp-tag-energy-high' :
e === 'medium' ? 'tdp-tag tdp-tag-energy-med'  :
                    'tdp-tag tdp-tag-energy-low';

/* ── Loading ── */
if (isLoading) return (
<div className="page-loading">
    <div className="music-loader">
    {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
    </div>
    <p style={{ color:'var(--text-tertiary)', marginTop:16 }} className="animate-pulse">Loading submissions…</p>
</div>
);

/* ── Error ── */
if (error || !track) return (
<div className="page-error animate-fade-in">
    <h2>Track Not Found</h2>
    <p>{error || 'This track does not exist'}</p>
    <Link to="/discover" className="btn-primary">Browse Tracks</Link>
</div>
);

return (
<div className="sp-page animate-fade-in">

    {/* Breadcrumb — matches TrackDetailPage */}
    <nav className="breadcrumb animate-slide-up">
    <Link to="/discover">Discover</Link>
    <span className="breadcrumb-sep">›</span>
    <Link to={`/tracks/${trackId}`}>{track.title}</Link>
    <span className="breadcrumb-sep">›</span>
    <span className="breadcrumb-current">Submissions</span>
    </nav>

    {/* Full-width player block — identical to TDP */}
    <div className="tdp-player-block animate-slide-up stagger-1">
    <WaveformPlayer
        audioUrl={track.audio_url}
        height={80}
        onPlay={handlePlay}
        onPause={handlePause}
    />
    </div>

    {/* Two-column grid — mirrors TrackDetailPage */}
    <div className="tdp-grid">

    {/* ── LEFT: Track info panel ── */}
    <div className="tdp-info animate-slide-up stagger-2">

        {/* Title row */}
        <div className="tdp-title-row">
        <h1 className="tdp-title">{track.title}</h1>
        {isPlaying && (
            <div className="eq-indicator" aria-label="Now playing">
            <span/><span/><span/><span/><span/>
            </div>
        )}
        </div>

        {/* Owner */}
        <div className="tdp-owner-row">
        <Link to={`/profile/${owner?.id}`} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div className="tdp-owner-avatar">{owner?.username?.charAt(0).toUpperCase()}</div>
            <div>
            <div className="tdp-owner-name">@{owner?.username}</div>
            <div className="tdp-owner-date">{new Date(track.created_at).toLocaleDateString()}</div>
            </div>
        </Link>
        {user && !isOwner && (
            <Link to={`/messages/new?userId=${owner?.id}`} className="tdp-message-btn">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Message
            </Link>
        )}
        </div>

        {/* Live stats from submissions */}
        <div className="tdp-stats">
        {[
            { l: 'Submissions', v: submissions.length },
            { l: 'Total Votes',  v: totalVotes },
            { l: 'Top Score',    v: topSubmission ? `+${topScore}` : '—' },
        ].map(s => (
            <div key={s.l} className="tdp-stat">
            <span className="tdp-stat-value">{s.v}</span>
            <span className="tdp-stat-label">{s.l}</span>
            </div>
        ))}
        </div>

        {/* MIR tags */}
        <div className="tdp-tags">
        {track.bpm          && <span className="tdp-tag tdp-tag-bpm">🎵 {Math.round(track.bpm)} BPM</span>}
        {track.musical_key  && <span className="tdp-tag tdp-tag-key">🎹 {track.musical_key}</span>}
        {track.energy_level && <span className={energyClass(track.energy_level)}>⚡ {track.energy_level}</span>}
        {track.genre        && <span className="tdp-tag tdp-tag-genre">🎸 {track.genre}</span>}
        </div>

        {track.description && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">About</div>
        <p className="tdp-description">{track.description}</p>
        </>)}

        {track.desired_skills?.length > 0 && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">🎯 Looking For</div>
        <div className="tdp-skills">
            {track.desired_skills.map((s,i) => <span key={i} className="tdp-skill">{s}</span>)}
        </div>
        </>)}
    </div>

    {/* ── RIGHT: Actions panel ── */}
    <div className="tdp-actions-panel animate-slide-up stagger-3">

        {/* Live leaderboard card */}
        {submissions.length > 0 && (
        <div className="tdp-action-card sp-leaderboard-card">
            <div className="section-label">🏆 Leaderboard</div>
            <div className="sp-leaderboard">
            {[...submissions]
                .sort((a,b) => ((b.upvotes||0)-(b.downvotes||0)) - ((a.upvotes||0)-(a.downvotes||0)))
                .slice(0, 3)
                .map((s, i) => {
                const score = (s.upvotes||0) - (s.downvotes||0);
                const medals = ['🥇','🥈','🥉'];
                return (
                    <div key={s.id} className="sp-leaderboard-row">
                    <span className="sp-medal">{medals[i]}</span>
                    <span className="sp-lb-name">{s.collaborator_name}</span>
                    <span className={`sp-lb-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}`}>
                        {score > 0 ? '+' : ''}{score}
                    </span>
                    </div>
                );
                })}
            </div>
        </div>
        )}

        {/* Submit action card */}
        <div className="tdp-action-card">
        <div className="section-label">Your Submission</div>

        {!user && (
            <Link to="/login" className="btn-primary" style={{ textAlign:'center' }}>
            Login to Submit
            </Link>
        )}

        {user && !isOwner && !canSubmit && (
            <>
            <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0, lineHeight:1.6 }}>
                You need an <strong style={{ color:'var(--text-primary)' }}>approved collaboration</strong> to submit a version.
            </p>
            <Link to={`/tracks/${trackId}`} className="btn-secondary" style={{ textAlign:'center' }}>
                Request Collaboration →
            </Link>
            </>
        )}

        {canSubmit && !showSubmitForm && (
            <button onClick={() => setShowSubmitForm(true)} className="btn-primary" style={{ width:'100%' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Submit Your Version
            </button>
        )}

        {canSubmit && showSubmitForm && (
            <button onClick={() => setShowSubmitForm(false)} className="btn-secondary" style={{ width:'100%' }}>
            ✕ Cancel Submission
            </button>
        )}

        {isOwner && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <Link to={`/tracks/${trackId}`} className="btn-secondary" style={{ textAlign:'center' }}>
                ← Back to Track
            </Link>
            {submissions.length > 0 && (
                <button onClick={handleCompleteTrack} className="btn-primary" style={{ width:'100%' }}>
                ✅ Mark as Completed
                </button>
            )}
            </div>
        )}
        </div>

        {/* Guidelines — only shown to eligible submitters */}
        {canSubmit && !showSubmitForm && (
        <div className="tdp-action-card sp-guidelines">
            <div className="section-label">📋 Guidelines</div>
            <ul className="sp-guidelines-list">
            <li>✅ Submit only your own work</li>
            <li>✅ Describe what you changed</li>
            <li>✅ Max file size: 50 MB</li>
            <li>✅ MP3, WAV or FLAC only</li>
            <li>⭐ Top voted gets featured</li>
            </ul>
        </div>
        )}
    </div>
    </div>

    {/* Inline submission form */}
    {showSubmitForm && (
    <div className="tdp-submissions animate-slide-down" style={{ marginBottom:20 }}>
        <div className="tdp-section-head">
        <h2 className="tdp-section-title">➕ New Submission</h2>
        </div>
        <SubmissionForm
        trackId={trackId}
        collaborationId={collaboration?.id}
        onSuccess={handleSubmissionSuccess}
        onCancel={() => setShowSubmitForm(false)}
        />
    </div>
    )}

    {/* Submissions list */}
    <div className="tdp-submissions animate-slide-up stagger-4">
    <div className="tdp-section-head">
        <h2 className="tdp-section-title">
        🎵 All Submissions
        {submissions.length > 0 && (
            <span className="sp-count-badge">{submissions.length}</span>
        )}
        </h2>
        {isOwner && submissions.length > 0 && (
        <button
            onClick={handleCompleteTrack}
            className="btn-primary"
            style={{ fontSize:13, padding:'7px 14px' }}
        >
            ✅ Pick Winner
        </button>
        )}
    </div>

    {submissionsLoading ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
        <div className="music-loader" style={{ justifyContent:'center' }}>
            {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
        </div>
        </div>
    ) : submissions.length === 0 ? (
        <div className="sp-empty">
        <span className="sp-empty-icon">🎵</span>
        <p className="sp-empty-title">No submissions yet</p>
        <p className="sp-empty-sub">
            {canSubmit
            ? 'Be the first to drop your version!'
            : 'Approved collaborators can submit their versions here.'}
        </p>
        {canSubmit && (
            <button onClick={() => setShowSubmitForm(true)} className="btn-primary" style={{ marginTop:16 }}>
            Submit Your Version
            </button>
        )}
        </div>
    ) : (
        <div className="sp-submissions-list">
        {[...submissions]
            .sort((a,b) => ((b.upvotes||0)-(b.downvotes||0)) - ((a.upvotes||0)-(a.downvotes||0)))
            .map((submission, idx) => (
            <SubmissionCard
                key={submission.id}
                submission={submission}
                isWinner={track.completed_submission_id === submission.id}
                rank={idx + 1}
            />
            ))}
        </div>
    )}
    </div>
</div>
);
};

export default SubmissionsPage;