import CommentItem from './CommentItem';

const CommentList = ({ comments, onCommentDelete, onCommentUpdate }) => {
    if (!comments || comments.length === 0) {
        return (
            <div className="no-comments">
                <span className="icon">💬</span>
                <p>No comments yet. Be the first to comment!</p>

                <style jsx>{`
                    .no-comments {
                        text-align: center;
                        padding: 48px 24px;
                        color: #b4b4b4;
                    }

                    .icon {
                        font-size: 48px;
                        display: block;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    .no-comments p {
                        margin: 0;
                        font-size: 14px;
                    }
                `}</style>
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