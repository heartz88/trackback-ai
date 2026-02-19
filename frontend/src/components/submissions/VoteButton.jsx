import { useState } from 'react';
import api from '../../services/api';

const VoteButton = ({ submissionId, initialVote, initialCounts, onVoteChange }) => {
    const [userVote, setUserVote] = useState(initialVote);
    const [upvotes, setUpvotes] = useState(initialCounts?.upvotes || 0);
    const [downvotes, setDownvotes] = useState(initialCounts?.downvotes || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleVote = async (voteType) => {
        if (isLoading) return;

        setIsLoading(true);
        const previousVote = userVote;
        const previousUpvotes = upvotes;
        const previousDownvotes = downvotes;

        try {
            // Optimistic update
            if (userVote === voteType) {
                // Remove vote
                setUserVote(null);
                if (voteType === 'upvote') {
                    setUpvotes(prev => prev - 1);
                } else {
                    setDownvotes(prev => prev - 1);
                }
            } else {
                // Add/change vote
                if (userVote) {
                    // Changing from one to another
                    if (userVote === 'upvote') {
                        setUpvotes(prev => prev - 1);
                        setDownvotes(prev => prev + 1);
                    } else {
                        setDownvotes(prev => prev - 1);
                        setUpvotes(prev => prev + 1);
                    }
                } else {
                    // Adding new vote
                    if (voteType === 'upvote') {
                        setUpvotes(prev => prev + 1);
                    } else {
                        setDownvotes(prev => prev + 1);
                    }
                }
                setUserVote(voteType);
            }

            // Make API call
            const response = await api.post(`/votes/submission/${submissionId}`, {
                vote_type: voteType
            });

            if (onVoteChange) {
                onVoteChange(response.data.vote);
            }
        } catch (error) {
            console.error('Vote error:', error);
            // Revert on error
            setUserVote(previousVote);
            setUpvotes(previousUpvotes);
            setDownvotes(previousDownvotes);
        } finally {
            setIsLoading(false);
        }
    };

    const score = upvotes - downvotes;

    return (
        <div className="vote-buttons">
            <button
                className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
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
                className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
                onClick={() => handleVote('downvote')}
                disabled={isLoading}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                </svg>
                <span>{downvotes}</span>
            </button>

            <style jsx>{`
                
            `}</style>
        </div>
    );
};

export default VoteButton;