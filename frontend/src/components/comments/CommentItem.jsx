import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useConfirm, useToast } from '../common/Toast';

/**
 * CommentItem
 *
 * Like system:
 * - Uses comment_likes table on backend (UNIQUE per user+comment)
 * - One like per user — clicking again unlikes (toggle)
 * - Heart fills when liked, count updates optimistically
 * - Accepts `user_liked` and `likes` from the comments fetch
 */
const CommentItem = ({ comment, onDelete, onUpdate, isReply = false }) => {
const toast   = useToast();
const confirm = useConfirm();
const { user } = useAuth();

const [isEditing,    setIsEditing]    = useState(false);
const [editContent,  setEditContent]  = useState(comment.content);
const [showReplies,  setShowReplies]  = useState(true);
const [isReplying,   setIsReplying]   = useState(false);
const [replyContent, setReplyContent] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

// Like state — initialised from server data (user_liked + likes count)
const [liked,    setLiked]    = useState(comment.user_liked || false);
const [likes,    setLikes]    = useState(comment.likes      || 0);
const [likeLoading, setLikeLoading] = useState(false);

const isOwner = user && user.id === comment.user?.id;

const formatDate = dateString => {
const date = new Date(dateString);
const now  = new Date();
const diff = Math.floor((now - date) / 1000);
if (diff < 60)     return 'just now';
if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
return date.toLocaleDateString();
};

const handleEdit = async () => {
if (!editContent.trim()) return;
setIsSubmitting(true);
try {
    const res = await api.put(`/comments/${comment.id}`, { content: editContent.trim() });
    if (onUpdate) onUpdate({ ...comment, ...res.data.comment });
    setIsEditing(false);
} catch {
    toast.error('Failed to update comment');
} finally {
    setIsSubmitting(false);
}
};

const handleDelete = async () => {
const ok = await confirm({
    title: 'Delete comment?',
    message: 'This cannot be undone.',
    confirmText: 'Delete',
    danger: true,
});
if (!ok) return;
try {
    await api.delete(`/comments/${comment.id}`);
    if (onDelete) onDelete(comment.id);
} catch {
    toast.error('Failed to delete comment');
}
};

// ── Like toggle — one per user, second click unlikes ──
const handleLike = async () => {
if (!user) { toast.info('Sign in to like comments'); return; }
if (likeLoading) return;

// Optimistic update
const prevLiked = liked;
const prevLikes = likes;
setLiked(!liked);
setLikes(liked ? likes - 1 : likes + 1);
setLikeLoading(true);

try {
    const res = await api.post(`/comments/${comment.id}/like`);
    // Sync with server truth
    setLiked(res.data.liked);
    setLikes(res.data.likes);
} catch {
    // Rollback
    setLiked(prevLiked);
    setLikes(prevLikes);
    toast.error('Failed to like comment');
} finally {
    setLikeLoading(false);
}
};

const handleReply = async () => {
if (!replyContent.trim()) return;
setIsSubmitting(true);
try {
    const res = await api.post('/comments', {
    submission_id: comment.submission_id,
    content: replyContent.trim(),
    parent_id: comment.id,
    });
    setReplyContent('');
    setIsReplying(false);
    // Parent (CommentSection) should refresh — signal via onUpdate
    if (onUpdate) onUpdate(null, 'reply_added');
} catch {
    toast.error('Failed to post reply');
} finally {
    setIsSubmitting(false);
}
};

return (
<div className={`comment-item ${isReply ? 'reply' : ''}`}>
    {/* Avatar */}
    <div className="comment-avatar">
    <div className="avatar">
        {comment.user?.username?.charAt(0).toUpperCase()}
    </div>
    </div>

    <div className="comment-content">
    {/* Header */}
    <div className="comment-header">
        <span className="comment-author">{comment.user?.username}</span>
        <span className="comment-timestamp">{formatDate(comment.created_at)}</span>
        {comment.updated_at && comment.updated_at !== comment.created_at && (
        <span className="edited-badge">(edited)</span>
        )}
    </div>

    {/* Body — edit mode or display */}
    {isEditing ? (
        <div className="comment-edit">
        <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            autoFocus
        />
        <div className="edit-actions">
            <button onClick={() => setIsEditing(false)} className="btn-cancel" disabled={isSubmitting}>Cancel</button>
            <button onClick={handleEdit} className="btn-save" disabled={isSubmitting || !editContent.trim()}>
            {isSubmitting ? 'Saving…' : 'Save'}
            </button>
        </div>
        </div>
    ) : (
        <p className="comment-text">{comment.content}</p>
    )}

    {/* Actions row */}
    <div className="comment-actions">
        {/* Like button — fills when liked, disabled when loading */}
        <button
        className={`action-btn like-btn ${liked ? 'liked' : ''}`}
        onClick={handleLike}
        disabled={likeLoading}
        title={liked ? 'Unlike' : 'Like'}
        >
        <svg
            width="13" height="13"
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ verticalAlign: 'middle', marginRight: 4 }}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {likes > 0 ? likes : ''}
        </button>

        {!isReply && (
        <button className="action-btn" onClick={() => setIsReplying(!isReplying)}>
            💬 Reply
        </button>
        )}

        {isOwner && !isEditing && (
        <>
            <button className="action-btn" onClick={() => setIsEditing(true)}>✏️ Edit</button>
            <button className="action-btn delete" onClick={handleDelete}>🗑️ Delete</button>
        </>
        )}
    </div>

    {/* Reply form */}
    {isReplying && (
        <div className="reply-form">
        <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            autoFocus
        />
        <div className="reply-actions">
            <button onClick={() => setIsReplying(false)} className="btn-cancel">Cancel</button>
            <button onClick={handleReply} className="btn-save" disabled={isSubmitting || !replyContent.trim()}>
            {isSubmitting ? 'Posting…' : 'Reply'}
            </button>
        </div>
        </div>
    )}

    {/* Nested replies */}
    {comment.replies?.length > 0 && (
        <div className="comment-replies">
        <button className="toggle-replies" onClick={() => setShowReplies(!showReplies)}>
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
                isReply
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
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .comment-item.reply {
        margin-left: 40px;
        padding-left: 16px;
        border-left: 2px solid rgba(20,184,166,0.25);
    }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { flex-shrink: 0; }
    .avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-primary-dark), var(--accent-primary));
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700; font-size: 15px;
    }
    .comment-content { flex: 1; min-width: 0; }
    .comment-header {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 6px; flex-wrap: wrap;
    }
    .comment-author { font-weight: 600; color: #fff; font-size: 13px; }
    .comment-timestamp { font-size: 11px; color: var(--text-tertiary); }
    .edited-badge { font-size: 11px; color: var(--text-tertiary); font-style: italic; }
    .comment-text { color: var(--text-primary); line-height: 1.6; margin: 0 0 10px; word-break: break-word; font-size: 14px; }
    .comment-edit textarea {
        width: 100%; box-sizing: border-box;
        background: rgba(0,0,0,0.3); border: 1px solid var(--surface-border);
        color: #fff; padding: 10px; border-radius: 8px;
        font-family: inherit; font-size: 14px; resize: vertical; margin-bottom: 8px;
    }
    .comment-edit textarea:focus { outline: none; border-color: var(--accent-primary); }
    .edit-actions, .reply-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .comment-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .action-btn {
        background: transparent; border: none;
        color: var(--text-tertiary); font-size: 12px;
        cursor: pointer; padding: 3px 8px; border-radius: 4px;
        transition: all 0.15s; display: flex; align-items: center; gap: 3px;
    }
    .action-btn:hover { background: rgba(255,255,255,0.05); color: var(--accent-primary); }
    .action-btn.delete:hover { color: #ef4444; }
    .action-btn.like-btn.liked { color: #f43f5e; }
    .action-btn.like-btn:hover { color: #f43f5e; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save, .btn-cancel {
        padding: 6px 14px; border-radius: 6px; font-size: 12px;
        font-weight: 600; cursor: pointer; transition: all 0.15s; border: none;
    }
    .btn-save {
        background: linear-gradient(135deg, var(--accent-primary-dark), var(--accent-primary));
        color: #fff;
    }
    .btn-save:hover:not(:disabled) { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel { background: rgba(255,255,255,0.05); color: var(--text-secondary); }
    .btn-cancel:hover { background: rgba(255,255,255,0.1); }
    .reply-form {
        margin-top: 10px; padding: 12px;
        background: rgba(0,0,0,0.2); border-radius: 8px;
    }
    .reply-form textarea {
        width: 100%; box-sizing: border-box;
        background: rgba(0,0,0,0.3); border: 1px solid var(--surface-border);
        color: #fff; padding: 8px 10px; border-radius: 6px;
        font-family: inherit; font-size: 13px; resize: vertical; margin-bottom: 8px;
    }
    .reply-form textarea:focus { outline: none; border-color: var(--accent-primary); }
    .comment-replies { margin-top: 14px; }
    .toggle-replies {
        background: rgba(255,255,255,0.04); border: 1px solid var(--surface-border);
        color: var(--text-tertiary); padding: 4px 10px; border-radius: 5px;
        font-size: 11px; cursor: pointer; transition: all 0.15s; margin-bottom: 10px;
    }
    .toggle-replies:hover { background: rgba(20,184,166,0.08); border-color: var(--accent-primary); color: #fff; }
    `}</style>
</div>
);
};

export default CommentItem;