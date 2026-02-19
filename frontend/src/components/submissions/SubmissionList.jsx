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
        </div>
    );
};

export default SubmissionList;