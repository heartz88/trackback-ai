import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../common/Toast';

/**
 * VoteButton — vertical upvote/downvote with score display.
 *
 * Voting rules (enforced on backend, reflected here):
 * - Track owner cannot vote (they pick the winner)
 * - Submitter cannot vote on their own submission
 * - Clicking your active vote again → removes it (toggle off)
 * - Clicking the other vote → switches it
 * - Fully optimistic UI with rollback on error
 */
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
const toast = useToast();

const [userVote, setUserVote]   = useState(initialVote || null);
const [upvotes, setUpvotes]     = useState(initialCounts?.upvotes   || 0);
const [downvotes, setDownvotes] = useState(initialCounts?.downvotes || 0);
const [isLoading, setIsLoading] = useState(false);

// Blocked-voter checks
const isOwnSubmission = user && submitterId  && user.id === submitterId;
const isTrackOwner    = user && trackOwnerId && user.id === trackOwnerId;
const cannotVote      = !user || isOwnSubmission || isTrackOwner;

const getBlockedReason = () => {
if (!user)            return 'Sign in to vote';
if (isOwnSubmission)  return "You can't vote on your own submission";
if (isTrackOwner)     return "Track owners pick the winner — voting not available";
return null;
};

const handleVote = async voteType => {
if (isLoading) return;

if (cannotVote) {
    toast.info(getBlockedReason());
    return;
}

setIsLoading(true);

// Snapshot for rollback
const prevVote      = userVote;
const prevUpvotes   = upvotes;
const prevDownvotes = downvotes;

try {
    // ── Optimistic update ──
    let newUp = upvotes, newDown = downvotes, newVote;

    if (userVote === voteType) {
    // Toggle off — remove vote
    newVote = null;
    if (voteType === 'upvote')   newUp   = newUp - 1;
    else                         newDown = newDown - 1;
    } else {
    // Switch or fresh vote
    if (userVote === 'upvote')   { newUp   = newUp - 1;   newDown = newDown + 1; }
    else if (userVote === 'downvote') { newDown = newDown - 1; newUp = newUp + 1; }
    else {
        if (voteType === 'upvote') newUp   = newUp + 1;
        else                       newDown = newDown + 1;
    }
    newVote = voteType;
    }

    setUserVote(newVote);
    setUpvotes(newUp);
    setDownvotes(newDown);
    if (onCountsChange) onCountsChange({ upvotes: newUp, downvotes: newDown });

    // ── API call ──
    const res = await api.post(`/collaborations/submissions/${submissionId}/vote`, {
    vote_type: voteType,
    });

    // Sync with server truth
    if (onVoteChange) onVoteChange(res.data.vote);
} catch (err) {
    // Rollback
    setUserVote(prevVote);
    setUpvotes(prevUpvotes);
    setDownvotes(prevDownvotes);
    if (onCountsChange) onCountsChange({ upvotes: prevUpvotes, downvotes: prevDownvotes });
    toast.error(err.response?.data?.error?.message || 'Failed to vote — please try again');
} finally {
    setIsLoading(false);
}
};

const score = upvotes - downvotes;
const blocked = cannotVote;
const blockedReason = getBlockedReason();

return (
<div
    className="sp-vote-widget"
    title={blocked ? blockedReason : undefined}
>
    {/* Upvote */}
    <button
    className={`sp-vote-up ${userVote === 'upvote' ? 'active' : ''} ${blocked ? 'blocked' : ''}`}
    onClick={() => handleVote('upvote')}
    disabled={isLoading}
    aria-label="Upvote"
    title={blocked ? blockedReason : userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
    >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4l8 8H4z"/>
    </svg>
    <span className="sp-vote-count">{upvotes}</span>
    </button>

    {/* Score */}
    <div className={`sp-vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'}`}>
    {score > 0 ? `+${score}` : score}
    </div>

    {/* Downvote */}
    <button
    className={`sp-vote-down ${userVote === 'downvote' ? 'active' : ''} ${blocked ? 'blocked' : ''}`}
    onClick={() => handleVote('downvote')}
    disabled={isLoading}
    aria-label="Downvote"
    title={blocked ? blockedReason : userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
    >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 20l-8-8h16z"/>
    </svg>
    <span className="sp-vote-count">{downvotes}</span>
    </button>

    {/* Loading spinner overlay */}
    {isLoading && <div className="sp-vote-loading"/>}
</div>
);
};

export default VoteButton;