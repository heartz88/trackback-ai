const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const onlineUsers = require('../config/onlineUsers');

const router = express.Router();

// POST /submission/:submissionId — Toggle upvote
router.post('/submission/:submissionId', authMiddleware, async (req, res) => {
try {
const { submissionId } = req.params;
const userId = req.user.id;

const subResult = await db.query(
    `SELECT s.*, t.user_id as track_owner_id, t.title as track_title
    FROM submissions s JOIN tracks t ON s.track_id = t.id WHERE s.id = $1`,
    [submissionId]
);
if (subResult.rows.length === 0)
    return res.status(404).json({ error: { message: 'Submission not found' } });

const sub = subResult.rows[0];
if (userId === sub.track_owner_id)
    return res.status(403).json({ error: { message: 'Track owner cannot vote on submissions' } });
if (userId === sub.collaborator_id)
    return res.status(403).json({ error: { message: 'Cannot vote on your own submission' } });

const existing = await db.query(
    'SELECT id FROM votes WHERE submission_id = $1 AND user_id = $2',
    [submissionId, userId]
);

if (existing.rows.length > 0) {
    await db.query('DELETE FROM votes WHERE id = $1', [existing.rows[0].id]);
    return res.json({ message: 'Vote removed', vote: null });
}

await db.query(
    `INSERT INTO votes (submission_id, user_id, vote_type) VALUES ($1, $2, 'upvote')`,
    [submissionId, userId]
);

await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'vote', $2, $3)`,
    [sub.collaborator_id, `Someone upvoted your submission on "${sub.track_title}"`, submissionId]
);

const submitterId = parseInt(sub.collaborator_id);
if (!onlineUsers?.has(submitterId)) {
    const voterResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
    triggerNotificationEmail(db, submitterId, 'vote', {
    voterName: voterResult.rows[0]?.username || 'Someone',
    trackTitle: sub.track_title,
    trackId: sub.track_id,
    });
}

res.json({ message: 'Vote recorded', vote: 'upvote' });
} catch (error) {
console.error('Vote error:', error);
res.status(500).json({ error: { message: 'Failed to record vote' } });
}
});

// GET /submission/:submissionId — Vote counts
router.get('/submission/:submissionId', async (req, res) => {
try {
const result = await db.query(
    `SELECT COUNT(*) FILTER (WHERE vote_type = 'upvote')::int AS upvotes,
            COUNT(*)::int AS total_votes
    FROM votes WHERE submission_id = $1`,
    [req.params.submissionId]
);
res.json({ upvotes: result.rows[0].upvotes, total: result.rows[0].total_votes });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch votes' } });
}
});

// GET /submission/:submissionId/user — Current user's vote
router.get('/submission/:submissionId/user', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    'SELECT vote_type FROM votes WHERE submission_id = $1 AND user_id = $2',
    [req.params.submissionId, req.user.id]
);
res.json({ vote: result.rows[0]?.vote_type || null });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch user vote' } });
}
});

module.exports = router;