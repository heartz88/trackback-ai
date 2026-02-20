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
                
            `}</style>
        </div>
    );
};

export default CommentItem;