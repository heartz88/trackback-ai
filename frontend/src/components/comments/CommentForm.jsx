import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommentForm = ({ submissionId, onCommentAdded }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!content.trim()) {
            setError('Comment cannot be empty');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await api.post('/comments', {
                submission_id: submissionId,
                content: content.trim()
            });

            setContent('');
            if (onCommentAdded) {
                onCommentAdded(response.data.comment);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="comment-form-login">
                <p>Please log in to comment</p>
                
                <style jsx>{`
                    .comment-form-login {
                        padding: 24px;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 12px;
                        text-align: center;
                        color: #b4b4b4;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="comment-form">
            <div className="form-header">
                <div className="avatar">
                    {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="form-content">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        maxLength={500}
                        disabled={isSubmitting}
                    />
                    <div className="form-footer">
                        <span className="char-count">{content.length}/500</span>
                        <button 
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="submit-btn"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </div>
            </div>
            {error && <div className="error-message">{error}</div>}
        </form>
    );
};

export default CommentForm;