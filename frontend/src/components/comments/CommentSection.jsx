import { useEffect, useState } from 'react';
import api from '../../services/api';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
const CommentSection = ({ submissionId, onCommentCountChange }) => {
const [comments, setComments] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => { fetchComments(); }, [submissionId]);

// Keep parent badge in sync
useEffect(() => {
if (onCommentCountChange) onCommentCountChange(comments.length);
}, [comments.length, onCommentCountChange]);

const fetchComments = async () => {
setIsLoading(true);
setError('');
try {
    const res = await api.get(`/comments/submission/${submissionId}`);
    setComments(res.data.comments || []);
} catch {
    setError('Failed to load comments');
} finally {
    setIsLoading(false);
}
};

const handleCommentAdded  = c  => setComments(prev => [c, ...prev]);
const handleCommentDelete = id => setComments(prev => prev.filter(c => c.id !== id));
const handleCommentUpdate = c  => setComments(prev => prev.map(x => x.id === c.id ? c : x));

return (
<div className="sp-comment-section">

    <div className="sp-comment-header">
    <span className="sp-comment-title">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        Comments
    </span>
    <span className="sp-comment-count">{comments.length}</span>
    </div>

    <CommentForm submissionId={submissionId} onCommentAdded={handleCommentAdded}/>

    {isLoading ? (
    <div className="sp-comment-loading">
        <div className="music-loader" style={{ justifyContent:'center' }}>
        {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
        </div>
    </div>
    ) : error ? (
    <div className="sp-comment-error">
        <p>{error}</p>
        <button onClick={fetchComments} className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>
        Try Again
        </button>
    </div>
    ) : comments.length === 0 ? (
    <div className="sp-comment-empty">
        <span>💬</span>
        <p>No comments yet — be the first!</p>
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