import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommentItem = ({ comment, onDelete, onUpdate, isReply = false }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplies, setShowReplies] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOwner = user && user.id === comment.user.id;

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

    const handleEdit = async () => {
        if (!editContent.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await api.put(`/comments/${comment.id}`, {
                content: editContent.trim()
            });

            if (onUpdate) {
                onUpdate(response.data.comment);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Failed to update comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await api.delete(`/comments/${comment.id}`);
            if (onDelete) {
                onDelete(comment.id);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    };

    const handleLike = async () => {
        try {
            await api.post(`/comments/${comment.id}/like`);
            // Optimistically update UI
            if (onUpdate) {
                onUpdate({
                    ...comment,
                    likes: comment.likes + 1
                });
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/comments', {
                submission_id: comment.submission_id,
                content: replyContent.trim(),
                parent_id: comment.id
            });

            setReplyContent('');
            setIsReplying(false);
            // Refresh comments would be handled by parent component
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`comment-item ${isReply ? 'reply' : ''}`}>
            <div className="comment-avatar">
                <div className="avatar">
                    {comment.user.username?.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className="comment-content">
                <div className="comment-header">
                    <span className="comment-author">{comment.user.username}</span>
                    <span className="comment-timestamp">{formatDate(comment.created_at)}</span>
                    {comment.updated_at !== comment.created_at && (
                        <span className="edited-badge">(edited)</span>
                    )}
                </div>

                {isEditing ? (
                    <div className="comment-edit">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="btn-cancel"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleEdit}
                                className="btn-save"
                                disabled={isSubmitting || !editContent.trim()}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="comment-text">{comment.content}</p>
                )}

                <div className="comment-actions">
                    <button className="action-btn" onClick={handleLike}>
                        ❤️ {comment.likes > 0 && comment.likes}
                    </button>

                    {!isReply && (
                        <button 
                            className="action-btn"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            💬 Reply
                        </button>
                    )}

                    {isOwner && !isEditing && (
                        <>
                            <button 
                                className="action-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                ✏️ Edit
                            </button>
                            <button 
                                className="action-btn delete"
                                onClick={handleDelete}
                            >
                                🗑️ Delete
                            </button>
                        </>
                    )}
                </div>

                {/* Reply Form */}
                {isReplying && (
                    <div className="reply-form">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                        />
                        <div className="reply-actions">
                            <button 
                                onClick={() => setIsReplying(false)}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReply}
                                className="btn-save"
                                disabled={isSubmitting || !replyContent.trim()}
                            >
                                {isSubmitting ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                        <button 
                            className="toggle-replies"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </button>

                        {showReplies && (
                            <div className="replies-container">
                                {comment.replies.map(reply => (
                                    <CommentItem 
                                        key={reply.id}
                                        comment={reply}
                                        onDelete={onDelete}
                                        onUpdate={onUpdate}
                                        isReply={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .comment-item {
                    display: flex;
                    gap: 16px;
                    padding: 20px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .comment-item.reply {
                    margin-left: 40px;
                    padding-left: 16px;
                    border-left: 2px solid rgba(155, 89, 182, 0.3);
                }

                .comment-item:last-child {
                    border-bottom: none;
                }

                .comment-avatar {
                    flex-shrink: 0;
                }

                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                }

                .comment-content {
                    flex: 1;
                    min-width: 0;
                }

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .comment-author {
                    font-weight: 600;
                    color: #ffffff;
                    font-size: 14px;
                }

                .comment-timestamp {
                    font-size: 12px;
                    color: #b4b4b4;
                }

                .edited-badge {
                    font-size: 11px;
                    color: #6b7280;
                    font-style: italic;
                }

                .comment-text {
                    color: #ffffff;
                    line-height: 1.6;
                    margin: 0 0 12px 0;
                    word-wrap: break-word;
                }

                .comment-edit textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 12px;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: vertical;
                    margin-bottom: 8px;
                }

                .comment-edit textarea:focus {
                    outline: none;
                    border-color: #9b59b6;
                }

                .edit-actions,
                .reply-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .comment-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    background: transparent;
                    border: none;
                    color: #b4b4b4;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #9b59b6;
                }

                .action-btn.delete:hover {
                    color: #ef4444;
                }

                .btn-save,
                .btn-cancel {
                    padding: 6px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-save {
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                }

                .btn-save:hover:not(:disabled) {
                    transform: translateY(-1px);
                }

                .btn-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-cancel {
                    background: rgba(255, 255, 255, 0.05);
                    color: #b4b4b4;
                }

                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .reply-form {
                    margin-top: 12px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                }

                .reply-form textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 13px;
                    resize: vertical;
                    margin-bottom: 8px;
                }

                .reply-form textarea:focus {
                    outline: none;
                    border-color: #9b59b6;
                }

                .comment-replies {
                    margin-top: 16px;
                }

                .toggle-replies {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #b4b4b4;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                }

                .toggle-replies:hover {
                    background: rgba(155, 89, 182, 0.1);
                    border-color: #9b59b6;
                    color: #ffffff;
                }

                .replies-container {
                    margin-top: 12px;
                }
            `}</style>
        </div>
    );
};

export default CommentItem;