import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
                        <Link to={`/profile/${submission.collaborator_id}`} className="flex items-center gap-3">
                        <div className="avatar">
                            {submission.collaborator_name?.charAt(0).toUpperCase()}
                        </div>
                    <div>
                    <h3 className="username hover:text-primary-400 transition-colors">
                        {submission.collaborator_name}
                    </h3>
                    <span className="timestamp">{formatDate(submission.created_at)}</span>
                    </div>
                    </Link>
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
                
            `}</style>
        </div>
    );
};

export default SubmissionCard;