import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CommentSection from '../comments/CommentSection';
import WaveformPlayer from '../tracks/WaveformPlayer';
import VoteButton from './VoteButton';

const SubmissionCard = ({ submission, isWinner = false, rank }) => {
const { user } = useAuth();
const [commentCount, setCommentCount] = useState(0);
const [userVote,     setUserVote]     = useState(submission.user_vote || null);
const [upvotes,      setUpvotes]      = useState(parseInt(submission.upvotes) || 0);
const [showComments, setShowComments] = useState(false);
const commentSectionRef = useRef(null);

// Sync if parent refetches submissions array
useEffect(() => {
setUserVote(submission.user_vote || null);
setUpvotes(parseInt(submission.upvotes) || 0);
}, [submission.id, submission.user_vote, submission.upvotes]);

useEffect(() => { fetchCommentCount(); }, [submission.id]);

const fetchCommentCount = async () => {
try {
    const res = await api.get(`/comments/submission/${submission.id}`);
    setCommentCount(res.data.total || res.data.comments?.length || 0);
} catch {}
};

const handleCommentToggle = () => {
setShowComments(prev => {
    if (!prev) {
    setTimeout(() => commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
    return !prev;
});
};

const formatDate = dateString => {
const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
if (diff < 60)     return 'just now';
if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
return new Date(dateString).toLocaleDateString();
};

const versionNum = parseInt(submission.version_number) || 1;

return (
<div className={`submission-card ${isWinner ? 'winner' : ''}`}>
    {isWinner && (
    <div className="winner-badge">
        <span className="crown">👑</span>
        <span>Winning Submission</span>
    </div>
    )}
    <div className="submission-content">
    {/* Waveform Player */}
    <div className="submission-player">
        <WaveformPlayer audioUrl={submission.audio_url} height={80}/>
    </div>

    {/* Info */}
    <div className="submission-info">

        {/* Author row */}
        <div className="user-header">
        <Link to={`/profile/${submission.collaborator_id}`} className="flex items-center gap-3 group">
            <div className="avatar group-hover:scale-105 transition-transform">
            {submission.collaborator_name?.charAt(0).toUpperCase()}
            </div>
            <div>
            <h3 className="username group-hover:text-primary-400 transition-colors">
                {submission.collaborator_name}
            </h3>
            <span className="timestamp">{formatDate(submission.created_at)}</span>
            </div>
        </Link>

        {user && user.id !== submission.collaborator_id && (
            <Link
            to={`/messages/new?userId=${submission.collaborator_id}`}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-tertiary)] hover:text-primary-400 rounded-lg text-xs transition-all border border-[var(--border-color)]"
            >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Message
            </Link>
        )}
        </div>

        {/* Title + version badge + rank medal */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <h4 className="submission-title" style={{ margin:0 }}>{submission.title}</h4>
        <span style={{
            fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:9999,
            background:'rgba(20,184,166,0.12)', color:'var(--accent-primary)',
            border:'1px solid rgba(20,184,166,0.25)', fontFamily:'monospace',
            letterSpacing:'0.05em'
        }}>
            v{versionNum}
        </span>
        {rank && rank <= 3 && (
            <span style={{ fontSize:16 }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
        )}
        </div>

        {submission.description && <p className="description">{submission.description}</p>}

        {/* Actions row */}
        <div className="submission-actions">
        <button
            className={`action-btn flex items-center gap-1.5 transition-all ${
            showComments
                ? 'text-primary-400 bg-primary-500/10 border-primary-500/30'
                : 'text-[var(--text-secondary)] hover:text-primary-400'
            }`}
            onClick={handleCommentToggle}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            {showComments
            ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
            : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            }
        </button>
        </div>
    </div>

    {/* Vote button — fixed: onCountsChange now wired so count updates after voting */}
    <div className="submission-voting">
        <VoteButton
        submissionId={submission.id}
        initialVote={userVote}
        initialCounts={{ upvotes }}
        onVoteChange={setUserVote}
        onCountsChange={({ upvotes: u }) => setUpvotes(u)}
        submitterId={submission.collaborator_id}
        trackOwnerId={submission.track_owner_id}
        />
    </div>
    </div>

    {/* Inline comments */}
    {showComments && (
    <div ref={commentSectionRef} className="mt-4 border-t border-[var(--border-color)] pt-4 animate-slide-down">
        <CommentSection submissionId={submission.id} onCommentCountChange={setCommentCount}/>
    </div>
    )}
</div>
);
};

export default SubmissionCard;