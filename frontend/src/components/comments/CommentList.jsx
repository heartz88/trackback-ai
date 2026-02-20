import CommentItem from './CommentItem';

const CommentList = ({ comments, onCommentDelete, onCommentUpdate }) => {
    if (!comments || comments.length === 0) {
        return (
            <div className="no-comments">
                <span className="icon">💬</span>
                <p>No comments yet. Be the first to comment!</p>
            </div>
        );
    }

    return (
        <div className="comment-list">
            {comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={onCommentDelete}
                    onUpdate={onCommentUpdate}
                />
            ))}

            <style jsx>{`
                .comment-list {
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
};

export default CommentList;