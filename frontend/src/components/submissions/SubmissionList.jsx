import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SubmissionCard from './SubmissionCard';

const SubmissionList = ({ trackId, limit, refresh }) => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [filterBy, setFilterBy] = useState('all');

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

            const response = await api.get(`/submissions/track/${trackId}`, { params });
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setError('Failed to load submissions');
        } finally {
            setIsLoading(false);
        }
    };

    // Limit the number of submissions shown
    const displaySubmissions = limit ? submissions.slice(0, limit) : submissions;

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
            {/* Show filters if not limited */}
            {!limit && (
                <div className="list-header">
                    <div className="list-stats">
                        <span className="stat-item">
                            🎵 {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                        </span>
                        <span className="stat-item">
                            🔥 {submissions.reduce((acc, sub) => acc + (sub.upvotes || 0), 0)} Upvotes
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
            )}

            {/* Submissions grid */}
            {displaySubmissions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No Submissions Yet</h3>
                    <p>Be the first to submit your version of this track!</p>
                </div>
            ) : (
                <>
                    <div className="submissions-grid">
                        {displaySubmissions.map((submission) => (
                            <SubmissionCard
                                key={submission.id}
                                submission={submission}
                            />
                        ))}
                    </div>
                    
                    {/* Show "View All" link if limited */}
                    {limit && submissions.length > limit && (
                        <div className="text-center mt-6">
                            <Link 
                                to={`/tracks/${trackId}/submissions`}
                                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                View all {submissions.length} submissions
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SubmissionList;