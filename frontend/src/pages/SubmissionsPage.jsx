import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import BackButton from '../components/common/BackButton';
import SubmissionCard from '../components/submissions/SubmissionCard';
import SubmissionForm from '../components/submissions/SubmissionForm';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import { useSubmissionsPage } from '../hooks/useSubmissionsPage';

const energyClass = e =>
e === 'high'   ? 'tdp-tag tdp-tag-energy-high' :
e === 'medium' ? 'tdp-tag tdp-tag-energy-med'  :
                'tdp-tag tdp-tag-energy-low';

export default function SubmissionsPage() {
const { trackSlug } = useParams();
const { user } = useAuth();
const {
track, owner, submissions, trackId,
isLoading, submissionsLoading, error,
showSubmitForm, setShowSubmitForm,
isPlaying, handlePlay, handlePause,
totalVotes, topScore, mySubmissions,
isOwner, canSubmit,
handleSubmissionSuccess, handleCompleteTrack,
} = useSubmissionsPage(trackSlug);

if (isLoading) return (
<div className="page-loading">
    <div className="music-loader">{[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}</div>
    <p style={{ color:'var(--text-tertiary)', marginTop:16 }} className="animate-pulse">Loading submissions…</p>
</div>
);

if (error || !track) return (
<div className="page-error animate-fade-in">
    <h2>Track Not Found</h2>
    <p>{error || 'This track does not exist'}</p>
    <Link to="/discover" className="btn-primary">Browse Tracks</Link>
</div>
);

const topSubmission = submissions.length > 0
? submissions.reduce((best, s) => (parseInt(s.upvotes) || 0) > (parseInt(best.upvotes) || 0) ? s : best)
: null;

return (
<div className="sp-page animate-fade-in">
    <div className="flex items-center gap-3 mb-4 animate-slide-up">
    <BackButton to={`/tracks/${trackSlug}`} label={track.title} />
    <span className="breadcrumb-sep text-[var(--text-tertiary)]">›</span>
    <span className="text-sm text-[var(--text-secondary)]">Submissions</span>
    </div>

    <div className="tdp-player-block animate-slide-up stagger-1">
    <WaveformPlayer audioUrl={track.audio_url} height={80} onPlay={handlePlay} onPause={handlePause} />
    </div>

    <div className="tdp-grid">
    {/* ── Left: track info ── */}
    <div className="tdp-info animate-slide-up stagger-2">
        <div className="tdp-title-row">
        <h1 className="tdp-title">{track.title}</h1>
        {isPlaying && <div className="eq-indicator" aria-label="Now playing"><span/><span/><span/><span/><span/></div>}
        </div>

        <div className="tdp-owner-row">
        <Link to={`/profile/${owner?.username}`} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <Avatar user={owner} size={40} />
            <div>
            <div className="tdp-owner-name">@{owner?.username}</div>
            <div className="tdp-owner-date">{new Date(track.created_at).toLocaleDateString()}</div>
            </div>
        </Link>
        {user && !isOwner && (
            <Link to={`/messages/${owner?.username}`} className="tdp-message-btn">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Message
            </Link>
        )}
        </div>

        <div className="tdp-stats">
        {[{ l:'Submissions', v:submissions.length }, { l:'Total Votes', v:totalVotes }, { l:'Top Score', v:topSubmission ? `+${topScore}` : '—' }].map(s => (
            <div key={s.l} className="tdp-stat">
            <span className="tdp-stat-value">{s.v}</span>
            <span className="tdp-stat-label">{s.l}</span>
            </div>
        ))}
        </div>

        <div className="tdp-tags">
        {track.bpm          && <span className="tdp-tag tdp-tag-bpm">{Math.round(track.bpm)} BPM</span>}
        {track.musical_key  && <span className="tdp-tag tdp-tag-key">{track.musical_key}</span>}
        {track.energy_level && <span className={energyClass(track.energy_level)}>{track.energy_level}</span>}
        {track.genre        && <span className="tdp-tag tdp-tag-genre">{track.genre}</span>}
        </div>

        {track.description && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">About</div>
        <p className="tdp-description">{track.description}</p>
        </>)}

        {track.desired_skills?.length > 0 && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">🎯 Looking For</div>
        <div className="tdp-skills">{track.desired_skills.map((s, i) => <span key={i} className="tdp-skill">{s}</span>)}</div>
        </>)}
    </div>

    {/* ── Right: actions panel ── */}
    <div className="tdp-actions-panel animate-slide-up stagger-3">
        {submissions.length > 0 && (
        <div className="tdp-action-card sp-leaderboard-card">
            <div className="section-label">Leaderboard</div>
            <div className="sp-leaderboard">
            {[...submissions].sort((a, b) => (parseInt(b.upvotes)||0) - (parseInt(a.upvotes)||0)).slice(0, 3).map((s, i) => (
                <div key={s.id} className="sp-leaderboard-row">
                <span className="sp-medal">{['🥇','🥈','🥉'][i]}</span>
                <span className="sp-lb-name">{s.collaborator_name}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--accent-primary)', display:'flex', alignItems:'center', gap:3 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {parseInt(s.upvotes) || 0}
                </span>
                </div>
            ))}
            </div>
        </div>
        )}

        <div className="tdp-action-card">
        <div className="section-label">Your Submission</div>
        {!user && <Link to="/login" className="btn-primary" style={{ textAlign:'center' }}>Login to Submit</Link>}

        {user && !isOwner && !canSubmit && (<>
            <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0, lineHeight:1.6 }}>
            You need an <strong style={{ color:'var(--text-primary)' }}>approved collaboration</strong> to submit a version.
            </p>
            <Link to={`/tracks/${trackSlug}`} className="btn-secondary" style={{ textAlign:'center' }}>Request Collaboration →</Link>
        </>)}

        {canSubmit && !showSubmitForm && (<>
            {mySubmissions.length > 0 && (
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8, lineHeight:1.5 }}>
                You have <strong style={{ color:'var(--accent-primary)' }}>{mySubmissions.length}</strong> version{mySubmissions.length > 1 ? 's' : ''} submitted.
                Upload a new version to improve your entry.
            </div>
            )}
            <button onClick={() => setShowSubmitForm(true)} className="btn-primary" style={{ width:'100%' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            {mySubmissions.length > 0 ? `Submit v${mySubmissions.length + 1}` : 'Submit Your Version'}
            </button>
        </>)}

        {canSubmit && showSubmitForm && (
            <button onClick={() => setShowSubmitForm(false)} className="btn-secondary" style={{ width:'100%' }}>✕ Cancel</button>
        )}

        {isOwner && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <Link to={`/tracks/${trackSlug}`} className="btn-secondary" style={{ textAlign:'center' }}>← Back to Track</Link>
            {submissions.length > 0 && (
                <button onClick={handleCompleteTrack} className="btn-primary" style={{ width:'100%' }}>Mark as Completed</button>
            )}
            </div>
        )}
        </div>

        {canSubmit && !showSubmitForm && (
        <div className="tdp-action-card sp-guidelines">
            <div className="section-label">📋 Guidelines</div>
            <ul className="sp-guidelines-list">
            <li>Submit only your own work</li>
            <li>Describe what you changed</li>
            <li>Max file size: 50 MB</li>
            <li>MP3, WAV or FLAC only</li>
            <li>⭐ Top voted gets featured</li>
            </ul>
        </div>
        )}
    </div>
    </div>

    {showSubmitForm && (
    <div className="tdp-submissions animate-slide-down" style={{ marginBottom:20 }}>
        <div className="tdp-section-head">
        <h2 className="tdp-section-title">➕ New Submission</h2>
        </div>
        <SubmissionForm trackId={trackId} onSuccess={handleSubmissionSuccess} onCancel={() => setShowSubmitForm(false)} />
    </div>
    )}

    <div className="tdp-submissions animate-slide-up stagger-4">
    <div className="tdp-section-head">
        <h2 className="tdp-section-title">
        🎵 All Submissions
        {submissions.length > 0 && <span className="sp-count-badge">{submissions.length}</span>}
        </h2>
        {isOwner && submissions.length > 0 && (
        <button onClick={handleCompleteTrack} className="btn-primary" style={{ fontSize:13, padding:'7px 14px' }}>Pick Winner</button>
        )}
    </div>

    {submissionsLoading ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
        <div className="music-loader" style={{ justifyContent:'center' }}>{[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}</div>
        </div>
    ) : submissions.length === 0 ? (
        <div className="sp-empty">
        <span className="sp-empty-icon">🎵</span>
        <p className="sp-empty-title">No submissions yet</p>
        <p className="sp-empty-sub">{canSubmit ? 'Be the first to drop your version!' : 'Approved collaborators can submit their versions here.'}</p>
        {canSubmit && <button onClick={() => setShowSubmitForm(true)} className="btn-primary" style={{ marginTop:16 }}>Submit Your Version</button>}
        </div>
    ) : (
        <div className="sp-submissions-list">
        {[...submissions].sort((a, b) => (parseInt(b.upvotes)||0) - (parseInt(a.upvotes)||0)).map((submission, idx) => (
            <SubmissionCard key={submission.id} submission={submission}
            isWinner={track.completed_submission_id === submission.id} rank={idx + 1} />
        ))}
        </div>
    )}
    </div>
</div>
);
}