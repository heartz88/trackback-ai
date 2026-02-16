import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SubmissionCard from './SubmissionCard';

const SubmissionList = ({ trackId, collaborationId, refresh }) => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('latest'); // 'latest', 'popular', 'controversial'
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'my', 'featured'

    useEffect(() => {
        fetchSubmissions();
    }, [trackId, sortBy, filterBy, refresh]);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = {
                sort: sortBy,
                filter: filterBy
            };

            const response = await api.get(`/tracks/${trackId}/submissions`, { params });
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setError('Failed to load submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (submissionId, voteType) => {
        if (!user) {
            alert('Please login to vote');
            return;
        }

        try {
            const response = await api.post(`/submissions/${submissionId}/vote`, {
                vote_type: voteType
            });

            // Update local state
            setSubmissions(prev => prev.map(sub => 
                sub.id === submissionId 
                    ? { 
                        ...sub, 
                        upvotes: response.data.upvotes,
                        downvotes: response.data.downvotes,
                        user_vote: response.data.user_vote 
                    }
                    : sub
            ));
        } catch (error) {
            console.error('Error voting:', error);
            alert('Failed to register vote');
        }
    };

    const handleComment = async (submissionId, content) => {
        if (!user) {
            alert('Please login to comment');
            return;
        }

        try {
            const response = await api.post(`/submissions/${submissionId}/comments`, {
                content
            });

            // Update submission with new comment
            setSubmissions(prev => prev.map(sub => 
                sub.id === submissionId 
                    ? { ...sub, comment_count: (sub.comment_count || 0) + 1 }
                    : sub
            ));
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    if (isLoading) {
        return (
            <div className="submission-list-loading">
                <div className="spinner-mini"></div>
                <span>Loading submissions...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="submission-list-error">
                <p>{error}</p>
                <button onClick={fetchSubmissions} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="submission-list">
            {/* Header with filters */}
            <div className="list-header">
                <div className="list-stats">
                    <span className="stat-item">
                        🎵 {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="stat-item">
                        🔥 {submissions.reduce((acc, sub) => acc + sub.upvotes, 0)} Upvotes
                    </span>
                </div>

                <div className="list-controls">
                    <select 
                        value={filterBy} 
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Submissions</option>
                        <option value="my">My Submissions</option>
                        <option value="featured">Featured</option>
                    </select>

                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="latest">Latest First</option>
                        <option value="popular">Most Popular</option>
                        <option value="controversial">Most Discussed</option>
                    </select>
                </div>
            </div>

            {/* Empty state */}
            {submissions.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No Submissions Yet</h3>
                    <p>
                        {collaborationId 
                            ? 'Be the first to submit your version of this track!'
                            : 'Collaborators haven\'t submitted any versions yet.'}
                    </p>
                </div>
            )}

            {/* Submissions grid */}
            <div className="submissions-grid">
                {submissions.map((submission) => (
                    <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        currentUser={user}
                        onVote={handleVote}
                        onComment={handleComment}
                        isCollaborator={collaborationId !== null}
                    />
                ))}
            </div>

            <style jsx>{`
                .submission-list-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 48px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                }

                .spinner-mini {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(155, 89, 182, 0.3);
                    border-top-color: #9b59b6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .submission-list-error {
                    text-align: center;
                    padding: 48px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 12px;
                    color: #ef4444;
                }

                .retry-btn {
                    margin-top: 16px;
                    padding: 8px 24px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .retry-btn:hover {
                    background: #dc2626;
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .list-stats {
                    display: flex;
                    gap: 24px;
                }

                .stat-item {
                    color: #b4b4b4;
                    font-size: 14px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 6px 16px;
                    border-radius: 20px;
                }

                .list-controls {
                    display: flex;
                    gap: 12px;
                }

                .filter-select,
                .sort-select {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-select:hover,
                .sort-select:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #9b59b6;
                }

                .filter-select option,
                .sort-select option {
                    background: #1e1e2f;
                    color: #ffffff;
                }

                .empty-state {
                    text-align: center;
                    padding: 64px 24px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    border: 2px dashed rgba(155, 89, 182, 0.3);
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 24px;
                    opacity: 0.5;
                }

                .empty-state h3 {
                    color: #ffffff;
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0 0 12px 0;
                }

                .empty-state p {
                    color: #b4b4b4;
                    margin: 0;
                }

                .submissions-grid {
                    display: grid;
                    gap: 24px;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .list-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .list-stats {
                        justify-content: center;
                    }

                    .list-controls {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubmissionList;