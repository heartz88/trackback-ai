import { useEffect, useState } from 'react';
import api from '../../services/api';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

const CommentSection = ({ submissionId }) => {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComments();
    }, [submissionId]);

    const fetchComments = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await api.get(`/comments/submission/${submissionId}`);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCommentAdded = (newComment) => {
        setComments(prevComments => [newComment, ...prevComments]);
    };

    const handleCommentDelete = (commentId) => {
        setComments(prevComments => 
            prevComments.filter(c => c.id !== commentId)
        );
    };

    const handleCommentUpdate = (updatedComment) => {
        setComments(prevComments =>
            prevComments.map(c => c.id === updatedComment.id ? updatedComment : c)
        );
    };

    return (
        <div className="comment-section">
            <div className="section-header">
                <h3>💬 Comments ({comments.length})</h3>
            </div>

            <CommentForm 
                submissionId={submissionId}
                onCommentAdded={handleCommentAdded}
            />

            {isLoading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading comments...</p>
                </div>
            ) : error ? (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={fetchComments} className="retry-btn">
                        Try Again
                    </button>
                </div>
            ) : (
                <CommentList
                    comments={comments}
                    onCommentDelete={handleCommentDelete}
                    onCommentUpdate={handleCommentUpdate}
                />
            )}

            <style jsx>{`
                .comment-section {
                    background: #1e1e2f;
                    border-radius: 12px;
                    padding: 24px;
                    margin-top: 32px;
                }

                .section-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .section-header h3 {
                    color: #ffffff;
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                }

                .loading,
                .error {
                    text-align: center;
                    padding: 48px 24px;
                    color: #b4b4b4;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #9b59b6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
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
            `}</style>
        </div>
    );
};

export default CommentSection;