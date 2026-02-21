import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../common/Toast';

const VoteButton = ({ submissionId, initialVote, initialCounts, onVoteChange, submitterId, trackOwnerId }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [userVote, setUserVote] = useState(initialVote);
    const [upvotes, setUpvotes] = useState(initialCounts?.upvotes || 0);
    const [downvotes, setDownvotes] = useState(initialCounts?.downvotes || 0);
    const [isLoading, setIsLoading] = useState(false);

    // Work out if this user is blocked from voting
    const isOwnSubmission = user && submitterId && user.id === submitterId;
    const isTrackOwner = user && trackOwnerId && user.id === trackOwnerId;
    const cannotVote = !user || isOwnSubmission || isTrackOwner;

    const getBlockedReason = () => {
        if (!user) return 'Sign in to vote';
        if (isOwnSubmission) return "You can't vote on your own submission";
        if (isTrackOwner) return "Track owners don't vote — you pick the winner";
        return null;
    };

    const handleVote = async (voteType) => {
        if (isLoading) return;

        if (cannotVote) {
            toast.info(getBlockedReason());
            return;
        }

        setIsLoading(true);
        const previousVote = userVote;
        const previousUpvotes = upvotes;
        const previousDownvotes = downvotes;

        try {
            // Optimistic update
            if (userVote === voteType) {
                setUserVote(null);
                if (voteType === 'upvote') setUpvotes(prev => prev - 1);
                else setDownvotes(prev => prev - 1);
            } else {
                if (userVote) {
                    if (userVote === 'upvote') { setUpvotes(prev => prev - 1); setDownvotes(prev => prev + 1); }
                    else { setDownvotes(prev => prev - 1); setUpvotes(prev => prev + 1); }
                } else {
                    if (voteType === 'upvote') setUpvotes(prev => prev + 1);
                    else setDownvotes(prev => prev + 1);
                }
                setUserVote(voteType);
            }

            const response = await api.post(`/collaborations/submissions/${submissionId}/vote`, {
                vote_type: voteType
            });

            if (onVoteChange) onVoteChange(response.data.vote);
        } catch (error) {
            console.error('Vote error:', error);
            setUserVote(previousVote);
            setUpvotes(previousUpvotes);
            setDownvotes(previousDownvotes);
            toast.error(error.response?.data?.error?.message || 'Failed to vote');
        } finally {
            setIsLoading(false);
        }
    };

    const score = upvotes - downvotes;

    return (
        <div className="vote-buttons" title={cannotVote ? getBlockedReason() : undefined}>
            <button
                className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''} ${cannotVote ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => handleVote('upvote')}
                disabled={isLoading}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14l5-5 5 5z"/>
                </svg>
                <span>{upvotes}</span>
            </button>

            <div className="vote-score">{score > 0 ? '+' : ''}{score}</div>

            <button
                className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''} ${cannotVote ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => handleVote('downvote')}
                disabled={isLoading}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                </svg>
                <span>{downvotes}</span>
            </button>
        </div>
    );
};

export default VoteButton;