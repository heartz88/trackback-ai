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

            <style jsx>{`
                .comment-form {
                    margin-bottom: 32px;
                }

                .form-header {
                    display: flex;
                    gap: 16px;
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
                    flex-shrink: 0;
                }

                .form-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: vertical;
                    transition: all 0.2s;
                }

                textarea:focus {
                    outline: none;
                    border-color: #9b59b6;
                    background: rgba(155, 89, 182, 0.05);
                }

                textarea:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .form-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .char-count {
                    font-size: 12px;
                    color: #b4b4b4;
                }

                .submit-btn {
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(155, 89, 182, 0.4);
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .error-message {
                    margin-top: 12px;
                    padding: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    border-radius: 8px;
                    font-size: 14px;
                }
            `}</style>
        </form>
    );
};

export default CommentForm;