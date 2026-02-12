import { useEffect, useState } from 'react';
import api from '../../services/api';
import SubmissionCard from './SubmissionCard';

const SubmissionList = ({ trackId, collaborationId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchSubmissions();
    }, [trackId, collaborationId, sortBy, filterStatus]);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        setError('');

        try {
            const endpoint = collaborationId 
                ? `/collaborations/${collaborationId}/submissions`
                : `/tracks/${trackId}/submissions`;

            const response = await api.get(endpoint, {
                params: {
                    sort: sortBy,
                    status: filterStatus !== 'all' ? filterStatus : undefined
                }
            });

            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setError('Failed to load submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const sortedSubmissions = [...submissions].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'most_voted':
                return (b.vote_score || 0) - (a.vote_score || 0);
            default:
                return 0;
        }
    });

    const winningSubmission = submissions.find(s => s.status === 'approved');

    if (isLoading) {
        return (
            <div className="submission-list-loading">
                <div className="spinner-large"></div>
                <p>Loading submissions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="submission-list-error">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button onClick={fetchSubmissions} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="submission-list">
            {/* Controls */}
            <div className="list-controls">
                <div className="control-group">
                    <label>Sort by:</label>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="most_voted">Most Voted</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Filter:</label>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('approved')}
                        >
                            Approved
                        </button>
                    </div>
                </div>
            </div>

            {/* Submission Count */}
            <div className="submission-count">
                {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
            </div>

            {/* Submissions */}
            {submissions.length === 0 ? (
                <div className="no-submissions">
                    <span className="empty-icon">📝</span>
                    <h3>No submissions yet</h3>
                    <p>Be the first to submit a completed version!</p>
                </div>
            ) : (
                <div className="submissions-container">
                    {/* Winning Submission First */}
                    {winningSubmission && (
                        <SubmissionCard 
                            submission={winningSubmission}
                            isWinner={true}
                        />
                    )}

                    {/* Other Submissions */}
                    {sortedSubmissions
                        .filter(s => s.id !== winningSubmission?.id)
                        .map(submission => (
                            <SubmissionCard 
                                key={submission.id}
                                submission={submission}
                            />
                        ))
                    }
                </div>
            )}

            <style jsx>{`
                .submission-list {
                    width: 100%;
                }

                .list-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .control-group label {
                    color: #b4b4b4;
                    font-size: 14px;
                    font-weight: 600;
                }

                .sort-select {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .sort-select:hover {
                    border-color: #9b59b6;
                }

                .sort-select:focus {
                    outline: none;
                    border-color: #9b59b6;
                }

                .filter-buttons {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    padding: 8px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #b4b4b4;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    border-color: #9b59b6;
                    background: rgba(155, 89, 182, 0.1);
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    border-color: transparent;
                    color: #ffffff;
                }

                .submission-count {
                    color: #b4b4b4;
                    font-size: 14px;
                    margin-bottom: 16px;
                }

                .submissions-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .no-submissions {
                    text-align: center;
                    padding: 64px 24px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 2px dashed rgba(255, 255, 255, 0.1);
                }

                .empty-icon {
                    font-size: 64px;
                    display: block;
                    margin-bottom: 16px;
                }

                .no-submissions h3 {
                    color: #ffffff;
                    font-size: 20px;
                    margin: 0 0 8px 0;
                }

                .no-submissions p {
                    color: #b4b4b4;
                    font-size: 14px;
                    margin: 0;
                }

                .submission-list-loading,
                .submission-list-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 64px 24px;
                    text-align: center;
                }

                .spinner-large {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #9b59b6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .submission-list-loading p,
                .submission-list-error p {
                    color: #b4b4b4;
                    font-size: 14px;
                    margin: 0;
                }

                .error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .retry-btn {
                    margin-top: 16px;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.2s;
                }

                .retry-btn:hover {
                    transform: translateY(-2px);
                }

                @media (max-width: 768px) {
                    .list-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .control-group {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }

                    .filter-buttons {
                        width: 100%;
                    }

                    .filter-btn {
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubmissionList;