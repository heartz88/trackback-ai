const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Add a comment to a submission
router.post('/', authMiddleware, async (req, res) => {
try {
    const { submission_id, content, parent_id } = req.body;
    const userId = req.user.id;

    console.log(`💬 New comment: User ${userId} on submission ${submission_id}`);

    if (!submission_id || !content || !content.trim()) {
        return res.status(400).json({ error: { message: 'Submission ID and content are required' } });
    }

    // Verify submission exists
    const submissionResult = await db.query(
        'SELECT s.*, u.username as submitter_username FROM submissions s JOIN users u ON s.collaborator_id = u.id WHERE s.id = $1',
        [submission_id]
    );

    if (submissionResult.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    const submission = submissionResult.rows[0];

    // If replying to a comment, verify parent exists
    if (parent_id) {
        const parentResult = await db.query(
            'SELECT id FROM comments WHERE id = $1 AND submission_id = $2',
            [parent_id, submission_id]
        );

        if (parentResult.rows.length === 0) {
            return res.status(404).json({ error: { message: 'Parent comment not found' } });
        }
    }

    // Create comment
    const result = await db.query(
        `INSERT INTO comments (submission_id, user_id, content, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
        [submission_id, userId, content.trim(), parent_id || null]
    );

    const comment = result.rows[0];

    // Get user info for the comment
    const userResult = await db.query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
    );

    const commentWithUser = {
        ...comment,
        user: userResult.rows[0]
    };

    // Create notification for submission owner (if not commenting on own submission)
    if (submission.collaborator_id !== userId) {
        await db.query(
            `INSERT INTO notifications (user_id, type, content, related_id)
                VALUES ($1, 'comment', $2, $3)`,
            [
                submission.collaborator_id,
                `${userResult.rows[0].username} commented on your submission "${submission.title}"`,
                comment.id
            ]
        );
    }

    // If replying to someone else's comment, notify them
    if (parent_id) {
        const parentCommentResult = await db.query(
            'SELECT user_id FROM comments WHERE id = $1',
            [parent_id]
        );
        
        const parentUserId = parentCommentResult.rows[0].user_id;
        
        if (parentUserId !== userId) {
            await db.query(
                `INSERT INTO notifications (user_id, type, content, related_id)
                    VALUES ($1, 'comment_reply', $2, $3)`,
                [
                    parentUserId,
                    `${userResult.rows[0].username} replied to your comment`,
                    comment.id
                ]
            );
        }
    }

    console.log(`✅ Comment ${comment.id} created successfully`);

    res.status(201).json({
        message: 'Comment added successfully',
        comment: commentWithUser
    });
} catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({ error: { message: 'Failed to add comment' } });
}
});

// Get comments for a submission (with nested replies)
router.get('/submission/:submissionId', async (req, res) => {
try {
    const { submissionId } = req.params;

    console.log(`📨 Fetching comments for submission ${submissionId}`);

    // Get all comments for the submission
    const result = await db.query(
        `SELECT c.*, 
                u.username, 
                u.email,
                u.id as user_id
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.submission_id = $1
            ORDER BY c.created_at ASC`,
        [submissionId]
    );

    // Organize comments into tree structure
    const commentsMap = new Map();
    const rootComments = [];

    // First pass: create all comment objects
    result.rows.forEach(row => {
        const comment = {
            id: row.id,
            submission_id: row.submission_id,
            content: row.content,
            likes: row.likes,
            created_at: row.created_at,
            updated_at: row.updated_at,
            parent_id: row.parent_id,
            user: {
                id: row.user_id,
                username: row.username,
                email: row.email
            },
            replies: []
        };
        commentsMap.set(row.id, comment);
    });

    // Second pass: build tree structure
    commentsMap.forEach(comment => {
        if (comment.parent_id === null) {
            rootComments.push(comment);
        } else {
            const parent = commentsMap.get(comment.parent_id);
            if (parent) {
                parent.replies.push(comment);
            }
        }
    });

    console.log(`✅ Found ${rootComments.length} root comments with ${result.rows.length - rootComments.length} replies`);

    res.json({
        comments: rootComments,
        total: result.rows.length
    });
} catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch comments' } });
}
});

// Update a comment
router.put('/:commentId', authMiddleware, async (req, res) => {
try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: { message: 'Content is required' } });
    }

    // Verify user owns the comment
    const commentResult = await db.query(
        'SELECT user_id FROM comments WHERE id = $1',
        [commentId]
    );

    if (commentResult.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Comment not found' } });
    }

    if (commentResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: { message: 'Unauthorized to edit this comment' } });
    }

    // Update comment
    const result = await db.query(
        `UPDATE comments 
            SET content = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *`,
        [content.trim(), commentId]
    );

    console.log(`✅ Comment ${commentId} updated`);

    res.json({
        message: 'Comment updated successfully',
        comment: result.rows[0]
    });
} catch (error) {
    console.error('❌ Update comment error:', error);
    res.status(500).json({ error: { message: 'Failed to update comment' } });
}
});

// Delete a comment
router.delete('/:commentId', authMiddleware, async (req, res) => {
try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Verify user owns the comment
    const commentResult = await db.query(
        'SELECT user_id FROM comments WHERE id = $1',
        [commentId]
    );

    if (commentResult.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Comment not found' } });
    }

    if (commentResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: { message: 'Unauthorized to delete this comment' } });
    }

    // Delete comment (CASCADE will delete replies)
    await db.query('DELETE FROM comments WHERE id = $1', [commentId]);

    console.log(`✅ Comment ${commentId} deleted`);

    res.json({ message: 'Comment deleted successfully' });
} catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ error: { message: 'Failed to delete comment' } });
}
});

// Like a comment
router.post('/:commentId/like', authMiddleware, async (req, res) => {
try {
    const { commentId } = req.params;

    const result = await db.query(
        `UPDATE comments 
            SET likes = likes + 1
            WHERE id = $1
            RETURNING likes`,
        [commentId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Comment not found' } });
    }

    res.json({ 
        message: 'Comment liked',
        likes: result.rows[0].likes 
    });
} catch (error) {
    console.error('❌ Like comment error:', error);
    res.status(500).json({ error: { message: 'Failed to like comment' } });
}
});

module.exports = router;