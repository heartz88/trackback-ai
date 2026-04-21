const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const onlineUsers = require('../config/onlineUsers');

const router = express.Router();

// POST / — Add a comment (or reply) to a submission
router.post('/', authMiddleware, async (req, res) => {
try {
const { submission_id, content, parent_id } = req.body;
const userId = req.user.id;

if (!submission_id || !content?.trim() || content.trim().length > 2000) {
    return res.status(400).json({ error: { message: 'Submission ID and content are required' } });
}

const submissionResult = await db.query(
    'SELECT s.*, u.username AS submitter_username FROM submissions s JOIN users u ON s.collaborator_id = u.id WHERE s.id = $1',
    [submission_id]
);

if (submissionResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
}

const submission = submissionResult.rows[0];

if (parent_id) {
    const parentResult = await db.query(
    'SELECT id FROM comments WHERE id = $1 AND submission_id = $2',
    [parent_id, submission_id]
    );
    if (parentResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Parent comment not found' } });
    }
}

const result = await db.query(
    `INSERT INTO comments (submission_id, user_id, content, parent_id)
    VALUES ($1, $2, $3, $4) RETURNING *`,
    [submission_id, userId, content.trim(), parent_id || null]
);

const comment = result.rows[0];

const userResult = await db.query('SELECT username, email, avatar_url, avatar_s3_key FROM users WHERE id = $1', [userId]);

const { getSignedUrl } = require('../config/s3');
const commentWithUser = {
    ...comment,
    user: {
        id: userId,
        username:   userResult.rows[0].username,
        email:      userResult.rows[0].email,
        avatar_url: userResult.rows[0].avatar_s3_key
            ? getSignedUrl(userResult.rows[0].avatar_s3_key)
            : userResult.rows[0].avatar_url,
    },
    likes: 0,
    user_liked: false,
    replies: []
};

// Notify submission owner (not if commenting on own)
if (submission.collaborator_id !== userId) {
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'comment', $2, $3)`,
    [submission.collaborator_id, `${userResult.rows[0].username} commented on your submission "${submission.title}"`, comment.id]
    );

    // Send email to submission owner if offline
    const trackInfo = await db.query('SELECT id, title FROM tracks WHERE id = $1', [submission.track_id]);
    const ownerId = parseInt(submission.collaborator_id);
    
    if (!onlineUsers?.has(ownerId)) {
        console.log(`[comments] User ${ownerId} is offline, sending comment email`);
        triggerNotificationEmail(db, ownerId, 'comment', {
            commenterName: userResult.rows[0].username,
            trackTitle: trackInfo.rows[0]?.title || 'your track',
            trackId: submission.track_id,
            commentText: content.trim(),
        });
    } else {
        console.log(`[comments] User ${ownerId} is online, skipping email`);
    }
}

// Notify parent comment author if this is a reply
if (parent_id) {
    const parentComment = await db.query('SELECT user_id FROM comments WHERE id = $1', [parent_id]);
    const parentUserId = parentComment.rows[0]?.user_id;
    if (parentUserId && parentUserId !== userId) {
    await db.query(
        `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'comment', $2, $3)`,
        [parentUserId, `${userResult.rows[0].username} replied to your comment`, comment.id]
    );
    }
}

res.status(201).json({ message: 'Comment added successfully', comment: commentWithUser });
} catch (error) {
console.error('Add comment error:', error);
res.status(500).json({ error: { message: 'Failed to add comment' } });
}
});

// GET /submission/:submissionId — Fetch nested comments tree
// userId is taken from the JWT (if present) — never from query params
router.get('/submission/:submissionId', async (req, res) => {
try {
const { submissionId } = req.params;

// Optionally authenticate — guests see comments but not their own like state
let userId = null;
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    userId = decoded.id || decoded.userId;
    } catch (_) { /* invalid/expired token — treat as guest */ }
}

const result = await db.query(
    `SELECT c.*,
            u.username,
            u.email,
            u.id AS user_id,
            u.avatar_url,
            u.avatar_s3_key,
            (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id) AS likes,
            (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id AND user_id = $2) > 0 AS user_liked
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.submission_id = $1
    ORDER BY c.created_at ASC`,
    [submissionId, userId]
);

// Build nested tree
const commentsMap = new Map();
const rootComments = [];

result.rows.forEach(row => {
    const comment = {
    id:            row.id,
    submission_id: row.submission_id,
    content:       row.content,
    likes:         row.likes,
    user_liked:    row.user_liked,
    created_at:    row.created_at,
    updated_at:    row.updated_at,
    parent_id:     row.parent_id,
    user: {
        id:          row.user_id,
        username:    row.username,
        email:       row.email,
        avatar_url:  row.avatar_s3_key
            ? require('../config/s3').getSignedUrl(row.avatar_s3_key)
            : row.avatar_url,
    },
    replies: []
    };
    commentsMap.set(row.id, comment);
});

commentsMap.forEach(comment => {
    if (!comment.parent_id) rootComments.push(comment);
    else {
    const parent = commentsMap.get(comment.parent_id);
    if (parent) parent.replies.push(comment);
    }
});

res.json({ comments: rootComments, total: result.rows.length });
} catch (error) {
console.error('Get comments error:', error);
res.status(500).json({ error: { message: 'Failed to fetch comments' } });
}
});

// PUT /:commentId — Edit a comment
router.put('/:commentId', authMiddleware, async (req, res) => {
try {
const { commentId } = req.params;
const { content } = req.body;
const userId = req.user.id;

if (!content?.trim()) {
    return res.status(400).json({ error: { message: 'Content is required' } });
}

const commentResult = await db.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
if (commentResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Comment not found' } });
}
if (commentResult.rows[0].user_id !== userId) {
    return res.status(403).json({ error: { message: 'Unauthorized to edit this comment' } });
}

const result = await db.query(
    `UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [content.trim(), commentId]
);

res.json({ message: 'Comment updated successfully', comment: result.rows[0] });
} catch (error) {
console.error('Update comment error:', error);
res.status(500).json({ error: { message: 'Failed to update comment' } });
}
});

// DELETE /:commentId — Delete a comment
router.delete('/:commentId', authMiddleware, async (req, res) => {
try {
const { commentId } = req.params;
const userId = req.user.id;

const commentResult = await db.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
if (commentResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Comment not found' } });
}
if (commentResult.rows[0].user_id !== userId) {
    return res.status(403).json({ error: { message: 'Unauthorized to delete this comment' } });
}

await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
res.json({ message: 'Comment deleted successfully' });
} catch (error) {
console.error('Delete comment error:', error);
res.status(500).json({ error: { message: 'Failed to delete comment' } });
}
});

// POST /:commentId/like — Toggle like on a comment
router.post('/:commentId/like', authMiddleware, async (req, res) => {
try {
const { commentId } = req.params;
const userId = req.user.id;

// Check if already liked
const existing = await db.query(
    'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
    [commentId, userId]
);

let liked;

if (existing.rows.length > 0) {
    // Unlike — remove the row
    await db.query('DELETE FROM comment_likes WHERE id = $1', [existing.rows[0].id]);
    liked = false;
} else {
    // Like — insert a row
    await db.query(
    'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
    [commentId, userId]
    );
    liked = true;
}

// Return fresh count
const countResult = await db.query(
    'SELECT COUNT(*)::int AS likes FROM comment_likes WHERE comment_id = $1',
    [commentId]
);

res.json({
    message: liked ? 'Comment liked' : 'Comment unliked',
    liked,
    likes: countResult.rows[0].likes
});
} catch (error) {
console.error('Like comment error:', error);
res.status(500).json({ error: { message: 'Failed to like comment' } });
}
});

module.exports = router;