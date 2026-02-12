import { useEffect, useState } from 'react';
import api from '../../services/api';
import WaveformPlayer from '../tracks/WaveformPlayer';
import VoteButton from './VoteButton';

const SubmissionCard = ({ submission, isWinner = false }) => {
    const [commentCount, setCommentCount] = useState(0);
    const [userVote, setUserVote] = useState(null);
    const [voteCounts, setVoteCounts] = useState({
        upvotes: 0,
        downvotes: 0
    });

    useEffect(() => {
        fetchVotes();
        fetchComments();
    }, [submission.id]);

    const fetchVotes = async () => {
        try {
            const response = await api.get(`/votes/submission/${submission.id}`);
            setVoteCounts({
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes
            });

            // Get user's vote
            const userVoteResponse = await api.get(`/votes/submission/${submission.id}/user`);
            setUserVote(userVoteResponse.data.vote);
        } catch (error) {
            console.error('Error fetching votes:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/comments/submission/${submission.id}`);
            setCommentCount(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

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
                    <WaveformPlayer 
                        audioUrl={submission.audio_url}
                        height={100}
                    />
                </div>

                {/* Info Section */}
                <div className="submission-info">
                    <div className="user-header">
                        <div className="avatar">
                            {submission.collaborator_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="username">{submission.collaborator_name}</h3>
                            <span className="timestamp">{formatDate(submission.created_at)}</span>
                        </div>
                    </div>

                    <h4 className="submission-title">{submission.title}</h4>
                    
                    {submission.description && (
                        <p className="description">{submission.description}</p>
                    )}

                    <div className="submission-actions">
                        <button className="action-btn">
                            💬 {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                        </button>
                    </div>
                </div>

                {/* Voting Section */}
                <div className="submission-voting">
                    <VoteButton
                        submissionId={submission.id}
                        initialVote={userVote}
                        initialCounts={voteCounts}
                        onVoteChange={setUserVote}
                    />
                </div>
            </div>

            <style jsx>{`
                .submission-card {
                    background: #1e1e2f;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 20px;
                    border: 1px solid #2d3748;
                    transition: all 0.3s ease;
                }

                .submission-card:hover {
                    border-color: #9b59b6;
                    box-shadow: 0 8px 16px rgba(155, 89, 182, 0.15);
                    transform: translateY(-2px);
                }

                .submission-card.winner {
                    border: 2px solid #f59e0b;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, #1e1e2f 100%);
                }

                .winner-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .crown {
                    font-size: 20px;
                }

                .submission-content {
                    display: grid;
                    grid-template-columns: 300px 1fr 120px;
                    gap: 24px;
                    align-items: start;
                }

                .user-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 20px;
                }

                .username {
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }

                .timestamp {
                    color: #b4b4b4;
                    font-size: 12px;
                }

                .submission-title {
                    color: #ffffff;
                    font-size: 18px;
                    margin: 0 0 12px 0;
                    font-weight: 600;
                }

                .description {
                    color: #b4b4b4;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 16px;
                }

                .submission-actions {
                    display: flex;
                    gap: 12px;
                }

                .action-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #b4b4b4;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: rgba(155, 89, 182, 0.1);
                    border-color: #9b59b6;
                    color: #ffffff;
                }

                @media (max-width: 1024px) {
                    .submission-content {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .submission-voting {
                        display: flex;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubmissionCard;