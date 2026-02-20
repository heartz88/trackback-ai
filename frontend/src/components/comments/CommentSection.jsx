import { useEffect, useState } from 'react';
import api from '../../services/api';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

const CommentSection = ({ submissionId, onCommentCountChange }) => {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComments();
    }, [submissionId]);

    // Notify parent whenever comment count changes
    useEffect(() => {
        if (onCommentCountChange) {
            onCommentCountChange(comments.length);
        }
    }, [comments.length, onCommentCountChange]);

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
        </div>
    );
};

export default CommentSection;