const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const { onlineUsers } = require('../server');

const router = express.Router();

// Vote on a submission
router.post('/submission/:submissionId', authMiddleware, async (req, res) => {
try {
    const { submissionId } = req.params;
    const { vote_type } = req.body;
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(vote_type)) {
        return res.status(400).json({ error: { message: 'Invalid vote type' } });
    }

    // Get submission details
    const submissionResult = await db.query(
        `SELECT s.*, t.user_id as track_owner_id, t.title as track_title
            FROM submissions s
            JOIN tracks t ON s.track_id = t.id
            WHERE s.id = $1`,
        [submissionId]
    );

    if (submissionResult.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    const submission = submissionResult.rows[0];

    // Check if user can vote
    if (userId === submission.track_owner_id) {
        return res.status(403).json({ 
            error: { message: 'Track owner cannot vote on submissions' } 
        });
    }

    if (userId === submission.collaborator_id) {
        return res.status(403).json({ 
            error: { message: 'Cannot vote on your own submission' } 
        });
    }

    // Check if user already voted
    const existingVote = await db.query(
        'SELECT id, vote_type FROM votes WHERE submission_id = $1 AND user_id = $2',
        [submissionId, userId]
    );

    if (existingVote.rows.length > 0) {
        const oldVote = existingVote.rows[0].vote_type;
        
        if (oldVote === vote_type) {
            // Remove vote if clicking same button
            await db.query('DELETE FROM votes WHERE id = $1', [existingVote.rows[0].id]);
            
            return res.json({ 
                message: 'Vote removed',
                vote: null 
            });
        } else {
            // Update vote
            await db.query(
                'UPDATE votes SET vote_type = $1, created_at = NOW() WHERE id = $2',
                [vote_type, existingVote.rows[0].id]
            );
            
            return res.json({ 
                message: 'Vote updated',
                vote: vote_type 
            });
        }
    } else {
        // Create new vote
        await db.query(
            'INSERT INTO votes (submission_id, user_id, vote_type) VALUES ($1, $2, $3)',
            [submissionId, userId, vote_type]
        );

        // Create notification for submitter
        await db.query(
            `INSERT INTO notifications (user_id, type, content, related_id)
                VALUES ($1, 'vote', $2, $3)`,
            [
                submission.collaborator_id,
                `Someone ${vote_type}d your submission on "${submission.track_title}"`,
                submissionId
            ]
        );

        // Send email to submitter if offline
        const submitterId = parseInt(submission.collaborator_id);
        if (!onlineUsers?.has(submitterId)) {
            console.log(`[votes] User ${submitterId} is offline, sending vote email`);
            
            // Get voter's name for the email
            const voterResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
            const voterName = voterResult.rows[0]?.username || 'Someone';
            
            triggerNotificationEmail(db, submitterId, 'vote', {
                voterName: voterName,
                trackTitle: submission.track_title,
                trackId: submission.track_id,
            });
        } else {
            console.log(`[votes] User ${submitterId} is online, skipping email`);
        }
        
        return res.json({ 
            message: 'Vote recorded',
            vote: vote_type 
        });
    }
} catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: { message: 'Failed to record vote' } });
}
});

// Get votes for a submission
router.get('/submission/:submissionId', async (req, res) => {
try {
    const { submissionId } = req.params;

    const result = await db.query(
        `SELECT 
            COUNT(*) FILTER (WHERE vote_type = 'upvote') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'downvote') as downvotes,
            COUNT(*) as total_votes
            FROM votes
            WHERE submission_id = $1`,
        [submissionId]
    );

    const votes = result.rows[0];
    const score = parseInt(votes.upvotes) - parseInt(votes.downvotes);

    res.json({
        upvotes: parseInt(votes.upvotes),
        downvotes: parseInt(votes.downvotes),
        total: parseInt(votes.total_votes),
        score: score
    });
} catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch votes' } });
}
});

// Get user's vote on a submission
router.get('/submission/:submissionId/user', authMiddleware, async (req, res) => {
try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const result = await db.query(
        'SELECT vote_type FROM votes WHERE submission_id = $1 AND user_id = $2',
        [submissionId, userId]
    );

    if (result.rows.length === 0) {
        return res.json({ vote: null });
    }

    res.json({ vote: result.rows[0].vote_type });
} catch (error) {
    console.error('Get user vote error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch user vote' } });
}
});

// Get top submissions by votes
router.get('/top', async (req, res) => {
try {
    const { limit = 10 } = req.query;

    const result = await db.query(
        `SELECT 
            s.id,
            s.track_id,
            s.title,
            COUNT(*) FILTER (WHERE v.vote_type = 'upvote') as upvotes,
            COUNT(*) FILTER (WHERE v.vote_type = 'downvote') as downvotes,
            COUNT(*) as total_votes
            FROM submissions s
            LEFT JOIN votes v ON s.id = v.submission_id
            GROUP BY s.id
            ORDER BY (COUNT(*) FILTER (WHERE v.vote_type = 'upvote') - COUNT(*) FILTER (WHERE v.vote_type = 'downvote')) DESC
            LIMIT $1`,
        [parseInt(limit)]
    );

    res.json({ submissions: result.rows });
} catch (error) {
    console.error('Get top submissions error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch top submissions' } });
}
});

module.exports = router;