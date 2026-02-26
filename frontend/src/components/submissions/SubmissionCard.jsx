import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CommentSection from '../comments/CommentSection';
import WaveformPlayer from '../tracks/WaveformPlayer';
import VoteButton from './VoteButton';

const SubmissionCard = ({ submission, isWinner = false, rank }) => {
const { user } = useAuth();
const [commentCount, setCommentCount]   = useState(submission.comment_count || 0);
const [userVote, setUserVote]           = useState(null);
const [voteCounts, setVoteCounts]       = useState({ upvotes: submission.upvotes || 0, downvotes: submission.downvotes || 0 });
const [showComments, setShowComments]   = useState(false);
const [isPlaying, setIsPlaying]         = useState(false);
const commentSectionRef = useRef(null);

useEffect(() => {
fetchUserVote();
// If upvotes/downvotes not on submission object, fetch them
if (submission.upvotes === undefined) fetchVotes();
fetchCommentCount();
}, [submission.id]);

const fetchVotes = async () => {
try {
    const res = await api.get(`/votes/submission/${submission.id}`);
    setVoteCounts({ upvotes: res.data.upvotes || 0, downvotes: res.data.downvotes || 0 });
} catch {}
};

const fetchUserVote = async () => {
if (!user) return;
try {
    const res = await api.get(`/votes/submission/${submission.id}/user`);
    setUserVote(res.data.vote || null);
} catch {}
};

const fetchCommentCount = async () => {
try {
    const res = await api.get(`/comments/submission/${submission.id}`);
    setCommentCount(res.data.total || res.data.comments?.length || 0);
} catch {}
};

const handleCommentToggle = () => {
setShowComments(prev => {
    if (!prev) {
    setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 100);
    }
    return !prev;
});
};

const formatDate = dateString => {
const d = new Date(dateString);
const diff = Math.floor((Date.now() - d) / 1000);
if (diff < 60)     return 'just now';
if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
return d.toLocaleDateString();
};

const score = (voteCounts.upvotes || 0) - (voteCounts.downvotes || 0);

// Medal for rank
const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

return (
<div className={`sp-card ${isWinner ? 'sp-card-winner' : ''} animate-fade-in`}>

    {/* Winner banner */}
    {isWinner && (
    <div className="sp-winner-banner">
        <span>👑</span>
        <span>Winning Submission</span>
        <span>👑</span>
    </div>
    )}

    <div className="sp-card-body">

    {/* ── Left: vote column ── */}
    <div className="sp-vote-col">
        {rankMedal && !isWinner && (
        <span className="sp-rank-medal" title={`Ranked #${rank}`}>{rankMedal}</span>
        )}
        <VoteButton
        submissionId={submission.id}
        initialVote={userVote}
        initialCounts={voteCounts}
        onVoteChange={vote => setUserVote(vote)}
        onCountsChange={counts => setVoteCounts(counts)}
        submitterId={submission.collaborator_id}
        trackOwnerId={submission.track_owner_id}
        />
    </div>

    {/* ── Right: content ── */}
    <div className="sp-card-content">

        {/* Header row */}
        <div className="sp-card-header">
        <Link to={`/profile/${submission.collaborator_id}`} className="sp-author-link">
            <div className="sp-author-avatar">
            {submission.collaborator_name?.charAt(0).toUpperCase()}
            </div>
            <div>
            <div className="sp-author-name">@{submission.collaborator_name}</div>
            <div className="sp-timestamp">{formatDate(submission.created_at)}</div>
            </div>
        </Link>

        {/* Score pill */}
        <div className={`sp-score-pill ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'}`}>
            {score > 0 ? `+${score}` : score}
        </div>

        {/* Message button */}
        {user && user.id !== submission.collaborator_id && (
            <Link
            to={`/messages/new?userId=${submission.collaborator_id}`}
            className="tdp-message-btn"
            style={{ marginLeft:'auto' }}
            >
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Message
            </Link>
        )}
        </div>

        {/* Title */}
        <h3 className="sp-card-title">{submission.title}</h3>

        {/* Description */}
        {submission.description && (
        <p className="sp-card-description">{submission.description}</p>
        )}

        {/* Waveform player */}
        <div className="sp-player">
        <WaveformPlayer
            audioUrl={submission.audio_url}
            height={70}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
        />
        </div>

        {/* Action bar */}
        <div className="sp-action-bar">
        {/* Playing indicator */}
        {isPlaying && (
            <div className="eq-indicator" aria-label="Playing" style={{ marginRight:4 }}>
            <span/><span/><span/><span/><span/>
            </div>
        )}

        {/* Comments toggle */}
        <button
            className={`sp-action-btn ${showComments ? 'active' : ''}`}
            onClick={handleCommentToggle}
        >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            {showComments
            ? <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
            : <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            }
        </button>

        {/* Vote summary text */}
        <span className="sp-vote-summary">
            <span className="sp-votes-up">↑ {voteCounts.upvotes || 0}</span>
            <span className="sp-votes-sep">·</span>
            <span className="sp-votes-down">↓ {voteCounts.downvotes || 0}</span>
        </span>
        </div>
    </div>
    </div>

    {/* Inline comments */}
    {showComments && (
    <div
        ref={commentSectionRef}
        className="sp-comments-panel animate-slide-down"
    >
        <CommentSection
        submissionId={submission.id}
        onCommentCountChange={setCommentCount}
        />
    </div>
    )}
</div>
);
};

export default SubmissionCard;