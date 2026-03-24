import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CommentSection from '../comments/CommentSection';
import { useToast } from '../common/Toast';
import WaveformPlayer from '../tracks/WaveformPlayer';
import RankBadge from './RankBadge';

export default function CompletedTrackCard({ track, rank, featured }) {
const { user } = useAuth();
const toast = useToast();
const commentSectionRef = useRef(null);
const [expanded, setExpanded] = useState(false);
const [showComments, setShowComments] = useState(false);
const [commentCount, setCommentCount] = useState(0);
const [liked, setLiked] = useState(track.winning_submission?.user_vote === 'upvote');
const [likeCount, setLikeCount] = useState(parseInt(track.winning_submission?.upvotes) || 0);
const [likeLoading, setLikeLoading] = useState(false);

const winner = track.winning_submission;
const isSubmitter = user && winner && user.id === Number(winner.collaborator_id);
const isOwner = user && user.id === Number(track.user_id);

const handleLike = async () => {
if (!user) { toast.info('Sign in to like tracks'); return; }
if (isSubmitter) { toast.info("You can't like your own submission"); return; }
if (isOwner) { toast.info('Track owners pick the winner — liking not available'); return; }
if (!winner || likeLoading) return;

const prevLiked = liked;
const prevCount = likeCount;
const newLiked = !liked;
setLiked(newLiked);
setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
setLikeLoading(true);

try {
    const res = await api.post('/submissions/' + winner.id + '/vote', { vote_type: 'upvote' });
    setLiked(res.data.vote === 'upvote');
    setLikeCount(typeof res.data.upvotes === 'number' ? res.data.upvotes : (newLiked ? prevCount + 1 : prevCount - 1));
} catch {
    setLiked(prevLiked);
    setLikeCount(prevCount);
    toast.error('Failed to like — try again');
} finally {
    setLikeLoading(false);
}
};

const handleCommentToggle = () => {
if (!user) { toast.info('Sign in to comment'); return; }
setShowComments(prev => {
    if (!prev) setTimeout(() => commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    return !prev;
});
};

const energyClass = (level) => {
if (level === 'high') return 'bg-red-500/10 text-red-400 border-red-500/30';
if (level === 'medium') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
return 'bg-green-500/10 text-green-400 border-green-500/30';
};

return (
<div
    className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
    featured 
        ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-500/5 to-transparent' 
        : 'border border-[var(--border-color)] bg-[var(--surface-1)]'
    }`}
>

    <div className="p-5">
    {/* Header with rank and title */}
    <div className="flex items-start gap-3 mb-4">
        <RankBadge rank={rank} />
        <div className="flex-1 min-w-0">
        <Link 
            to={`/tracks/${track.id}`}
            className="text-lg font-bold text-[var(--text-primary)] hover:text-primary-400 transition-colors line-clamp-1"
        >
            {track.title}
        </Link>
        <div className="text-sm text-[var(--text-secondary)] mt-1">
            by{' '}
            <Link to={`/profile/${track.owner_username}`} className="text-primary-400 hover:text-primary-300">
            @{track.owner_username}
            </Link>
            {winner && (
            <>
                {' · completed by '}
                <Link to={`/profile/${winner.collaborator_name}`} className="text-primary-400 hover:text-primary-300">
                @{winner.collaborator_name}
                </Link>
            </>
            )}
        </div>
        </div>

        {winner && (
        <div className="flex flex-col items-center px-3 py-2 bg-[var(--surface-2)] rounded-lg border border-[var(--border-color)]">
            <span className="text-lg">❤️</span>
            <span className="font-bold text-primary-400">{likeCount}</span>
            <span className="text-xs text-[var(--text-tertiary)]">Likes</span>
        </div>
        )}
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-2 mb-4">
        {track.bpm && (
        <span className="px-2 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-400">
            🎵 {Math.round(track.bpm)} BPM
        </span>
        )}
        {track.musical_key && (
        <span className="px-2 py-1 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)]">
            🎹 {track.musical_key}
        </span>
        )}
        {track.energy_level && (
        <span className={`px-2 py-1 rounded-full text-xs border ${energyClass(track.energy_level)}`}>
            ⚡ {track.energy_level}
        </span>
        )}
        {track.genre && (
        <span className="px-2 py-1 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-secondary)]">
            🎸 {track.genre}
        </span>
        )}
        <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs">
        ✅ Completed
        </span>
    </div>

    {/* Waveform toggle */}
    <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-4"
    >
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {expanded ? 'Hide preview' : 'Preview original loop'}
    </button>

    {expanded && (
        <div className="mb-4 space-y-3">
        <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">Original Loop</div>
            <WaveformPlayer audioUrl={track.audio_url} height={56} />
        </div>
        {winner && winner.audio_url && (
            <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">
                Winning Submission — v{winner.version_number || 1}
            </div>
            <WaveformPlayer audioUrl={winner.audio_url} height={56} />
            </div>
        )}
        </div>
    )}

    {/* Footer */}
    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div className="flex gap-4 text-sm text-[var(--text-tertiary)]">
        <span>{track.collaborator_count || 1} collaborators</span>
        <span>{track.submissions_count || 1} submissions</span>
        </div>

        <div className="flex gap-2">
        {winner && (
            <>
            <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                liked 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}
            >
                <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likeCount > 0 && likeCount}
            </button>

            <button
                onClick={handleCommentToggle}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showComments
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {commentCount > 0 && commentCount}
            </button>
            </>
        )}

        <Link
            to={`/tracks/${track.id}`}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
        >
            View track
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
        </div>
    </div>

    {/* Comments */}
    {showComments && winner && user && (
        <div ref={commentSectionRef} className="mt-4 pt-4 border-t border-[var(--border-color)]">
        <CommentSection submissionId={winner.id} onCommentCountChange={setCommentCount} />
        </div>
    )}
    </div>
</div>
);
}