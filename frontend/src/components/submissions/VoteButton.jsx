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
                .vote-buttons {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                }

                .vote-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: transparent;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #b4b4b4;
                    font-size: 14px;
                    font-weight: 600;
                }

                .vote-btn:hover:not(:disabled) {
                    border-color: #9b59b6;
                    background: rgba(155, 89, 182, 0.1);
                    transform: scale(1.05);
                }

                .vote-btn.upvote.active {
                    border-color: #10b981;
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }

                .vote-btn.downvote.active {
                    border-color: #ef4444;
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .vote-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .vote-score {
                    font-size: 18px;
                    font-weight: 700;
                    color: #ffffff;
                    padding: 4px 0;
                }
            `}</style>
        </div>
    );
};

export default VoteButton;