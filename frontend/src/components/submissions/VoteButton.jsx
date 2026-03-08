import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../common/Toast';


const VoteButton = ({
submissionId,
initialVote,
initialCounts,
onVoteChange,
onCountsChange,
submitterId,
trackOwnerId,
}) => {
const { user } = useAuth();
const toast    = useToast();

const [liked,    setLiked]   = useState(initialVote === 'upvote');
const [upvotes,  setUpvotes] = useState(Number(initialCounts?.upvotes) || 0);
const [loading,  setLoading] = useState(false);

const isOwnSubmission = user && submitterId  && user.id === Number(submitterId);
const isTrackOwner    = user && trackOwnerId && user.id === Number(trackOwnerId);
const blocked         = !user || isOwnSubmission || isTrackOwner;

const getBlockedReason = () => {
if (!user)           return 'Sign in to like submissions';
if (isOwnSubmission) return "You can't like your own submission";
if (isTrackOwner)    return 'Track owners pick the winner — liking not available';
return null;
};

const handleClick = async () => {
if (loading) return;

if (blocked) {
    toast.info(getBlockedReason());
    return;
}

// Optimistic update
const prevLiked   = liked;
const prevUpvotes = upvotes;
const newLiked    = !liked;
const newUpvotes  = newLiked ? upvotes + 1 : upvotes - 1;

setLiked(newLiked);
setUpvotes(newUpvotes);
if (onCountsChange) onCountsChange({ upvotes: newUpvotes });
if (onVoteChange)   onVoteChange(newLiked ? 'upvote' : null);

setLoading(true);
try {
    const res = await api.post(`/submissions/${submissionId}/vote`, {
    vote_type: 'upvote',
    });

    // Sync with server's authoritative count
    const serverUpvotes = res.data.upvotes ?? newUpvotes;
    const serverVote    = res.data.vote;     // 'upvote' | null

    setLiked(serverVote === 'upvote');
    setUpvotes(serverUpvotes);
    if (onCountsChange) onCountsChange({ upvotes: serverUpvotes });
    if (onVoteChange)   onVoteChange(serverVote);
} catch (err) {
    // Rollback
    setLiked(prevLiked);
    setUpvotes(prevUpvotes);
    if (onCountsChange) onCountsChange({ upvotes: prevUpvotes });
    if (onVoteChange)   onVoteChange(prevLiked ? 'upvote' : null);
    toast.error(err.response?.data?.error?.message || 'Failed to like — try again');
} finally {
    setLoading(false);
}
};

const blockedReason = getBlockedReason();

return (
<button
    className={`sp-like-btn ${liked ? 'liked' : ''} ${blocked ? 'blocked' : ''} ${loading ? 'loading' : ''}`}
    onClick={handleClick}
    disabled={loading}
    aria-label={liked ? 'Unlike' : 'Like'}
    title={blocked ? blockedReason : liked ? 'Remove like' : 'Like this submission'}
>
    {/* Heart icon — filled when liked */}
    <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={liked ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sp-heart-icon"
    >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>

    <span className="sp-like-count">{upvotes > 0 ? upvotes : ''}</span>

    {/* Tiny loading ring */}
    {loading && <span className="sp-like-spinner"/>}
</button>
);
};

export default VoteButton;