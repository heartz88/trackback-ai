const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { uploadToS3, getSignedUrl } = require('../config/s3');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const onlineUsers = require('../config/onlineUsers');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
storage,
limits: { fileSize: 50 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
if (allowedTypes.includes(file.mimetype)) cb(null, true);
else cb(new Error('Invalid file type'));
}
});

// ─────────────────────────────────────────────────────────────────
// POST / — Submit a completed version
// Unlimited versions per collaborator — each gets a version_number
// ─────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('audio'), async (req, res) => {
try {
const { track_id, title, description } = req.body;
const collaboratorId = req.user.id;

if (!req.file) {
    return res.status(400).json({ error: { message: 'No audio file provided' } });
}

// Verify approved collaboration exists
const collabCheck = await db.query(
    `SELECT cr.id 
    FROM collaboration_requests cr
    WHERE cr.track_id = $1 AND cr.collaborator_id = $2 AND cr.status = 'approved'`,
    [track_id, collaboratorId]
);

if (collabCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'No approved collaboration found' } });
}

// Work out the next version number for this collaborator on this track
const versionResult = await db.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
    FROM submissions
    WHERE track_id = $1 AND collaborator_id = $2`,
    [track_id, collaboratorId]
);
const versionNumber = versionResult.rows[0].next_version;

// Upload to S3
const timestamp = Date.now();
const fileExt   = req.file.originalname.split('.').pop();
const s3Key     = `submissions/${track_id}/${collaboratorId}/${timestamp}_v${versionNumber}.${fileExt}`;

await uploadToS3(req.file, s3Key);

// Create submission row
const result = await db.query(
    `INSERT INTO submissions (track_id, collaborator_id, title, description, s3_key, file_format, version_number)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [track_id, collaboratorId, title, description, s3Key, fileExt, versionNumber]
);

// Notify track owner
const trackOwner = await db.query('SELECT user_id, title FROM tracks WHERE id = $1', [track_id]);

await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'submission', $2, $3)`,
    [
    trackOwner.rows[0].user_id,
    `${req.user.username} submitted version ${versionNumber} of "${trackOwner.rows[0].title}"`,
    result.rows[0].id
    ]
);

// Send email to track owner
if (!onlineUsers?.has(trackOwner.rows[0].user_id)) {
    triggerNotificationEmail(db, trackOwner.rows[0].user_id, 'submission', {
    collaboratorName: req.user.username,
    trackTitle: trackOwner.rows[0].title,
    trackId: track_id,
});
}

res.status(201).json({
    message: 'Submission uploaded successfully',
    submission: { ...result.rows[0], audio_url: getSignedUrl(s3Key) }
});
} catch (error) {
console.error('Submit error:', error);
res.status(500).json({ error: { message: 'Failed to submit' } });
}
});

// ─────────────────────────────────────────────────────────────────
// GET /track/:trackId — Fetch all submissions for a track
// Works with or without auth — user_vote is null for guests
// Handles sort/filter query params from old SubmissionList component
// ─────────────────────────────────────────────────────────────────
router.get('/track/:trackId', async (req, res) => {
try {
const { trackId } = req.params;
const userId = req.user?.id ?? null;

// Use parameterised query throughout — never interpolate user values into SQL
const result = await db.query(
    `SELECT s.id, s.track_id, s.collaborator_id, s.title, s.description,
            s.s3_key, s.file_format, s.status, s.created_at, s.updated_at,
            COALESCE(s.version_number, 1) AS version_number,
            u.username AS collaborator_name,
            t.user_id  AS track_owner_id,
            (SELECT COUNT(*)::int FROM votes WHERE submission_id = s.id AND vote_type = 'upvote') AS upvotes,
            (SELECT vote_type FROM votes WHERE submission_id = s.id AND user_id = $2 LIMIT 1) AS user_vote
    FROM submissions s
    JOIN users  u ON s.collaborator_id = u.id
    JOIN tracks t ON s.track_id = t.id
    WHERE s.track_id = $1
    ORDER BY upvotes DESC, s.created_at DESC`,
    [trackId, userId]  // userId is null for guests — postgres handles NULL safely in subquery
);

const submissions = result.rows.map(sub => ({
    ...sub,
    audio_url: getSignedUrl(sub.s3_key),
    score: sub.upvotes || 0,
}));

res.json({ submissions });
} catch (error) {
console.error('Get submissions error:', error);
res.status(500).json({ error: { message: 'Failed to fetch submissions' } });
}
});

// ─────────────────────────────────────────────────────────────────
// GET /track/:trackId/stats — Voting stats (backward compat)
// ─────────────────────────────────────────────────────────────────
router.get('/track/:trackId/stats', async (req, res) => {
try {
const { trackId } = req.params;
const result = await db.query(
    `SELECT
    COUNT(*)::int AS active_submissions,
    COALESCE(SUM((SELECT COUNT(*)::int FROM votes WHERE submission_id = s.id AND vote_type = 'upvote')), 0)::int AS total_votes
    FROM submissions s WHERE s.track_id = $1`,
    [trackId]
);
const row = result.rows[0];
res.json({ stats: { totalVotes: row.total_votes || 0, activeSubmissions: row.active_submissions || 0, featured: 0 } });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch stats' } });
}
});

// ─────────────────────────────────────────────────────────────────
// POST /:id/vote  — Upvote-only, toggles on second click
// ─────────────────────────────────────────────────────────────────
router.post('/:id/vote', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const userId = req.user.id;

const subResult = await db.query(
    `SELECT s.*, t.user_id AS track_owner_id
    FROM submissions s JOIN tracks t ON s.track_id = t.id
    WHERE s.id = $1`,
    [id]
);

if (subResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
}

const submission = subResult.rows[0];

if (userId === submission.track_owner_id) {
    return res.status(403).json({ error: { message: 'Track owners choose the winner — voting not available' } });
}
if (userId === submission.collaborator_id) {
    return res.status(403).json({ error: { message: 'You cannot vote on your own submission' } });
}

const existing = await db.query(
    'SELECT id FROM votes WHERE submission_id = $1 AND user_id = $2',
    [id, userId]
);

if (existing.rows.length > 0) {
    // Toggle off
    await db.query('DELETE FROM votes WHERE id = $1', [existing.rows[0].id]);
    const countResult = await db.query(
    `SELECT COUNT(*)::int AS upvotes FROM votes WHERE submission_id = $1`,
    [id]
    );
    return res.json({ message: 'Vote removed', vote: null, upvotes: countResult.rows[0].upvotes });
}

// New upvote
await db.query(
    `INSERT INTO votes (submission_id, user_id, vote_type) VALUES ($1, $2, 'upvote')`,
    [id, userId]
);

await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'vote', $2, $3)`,
    [submission.collaborator_id, `Someone liked your submission`, id]
);

// Send email to submitter
const trackInfo = await db.query('SELECT id, title FROM tracks WHERE id = $1', [submission.track_id]);
if (!onlineUsers?.has(submission.collaborator_id)) {
    triggerNotificationEmail(db, submission.collaborator_id, 'vote', {
    voterName: req.user.username,
    trackTitle: trackInfo.rows[0]?.title || 'your track',
    trackId: submission.track_id,
});
}

const countResult = await db.query(
    `SELECT COUNT(*)::int AS upvotes FROM votes WHERE submission_id = $1`,
    [id]
);

res.json({ message: 'Vote recorded', vote: 'upvote', upvotes: countResult.rows[0].upvotes });
} catch (error) {
console.error('Vote error:', error);
res.status(500).json({ error: { message: 'Failed to record vote' } });
}
});

// ─────────────────────────────────────────────────────────────────
// Comments — kept here for backward compat with old route mounts
// ─────────────────────────────────────────────────────────────────
router.post('/:id/comments', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const { content } = req.body;
const userId = req.user.id;

const result = await db.query(
    `INSERT INTO comments (submission_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [id, userId, content]
);

const submission = await db.query('SELECT collaborator_id, track_id FROM submissions WHERE id = $1', [id]);
if (submission.rows[0].collaborator_id !== userId) {
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'comment', $2, $3)`,
    [submission.rows[0].collaborator_id, `${req.user.username} commented on your submission`, result.rows[0].id]
    );

    // Send email to submitter
    const trackInfo = await db.query('SELECT id, title FROM tracks WHERE id = $1', [submission.rows[0].track_id]);
    if (!onlineUsers?.has(submission.rows[0].collaborator_id)) {
    triggerNotificationEmail(db, submission.rows[0].collaborator_id, 'comment', {
    commenterName: req.user.username,
    trackTitle: trackInfo.rows[0]?.title || 'your track',
    trackId: submission.rows[0].track_id,
    commentText: content,
    });
}
}

res.status(201).json({ message: 'Comment added', comment: result.rows[0] });
} catch (error) {
console.error('Comment error:', error);
res.status(500).json({ error: { message: 'Failed to add comment' } });
}
});

router.get('/:id/comments', async (req, res) => {
try {
const { id } = req.params;
const result = await db.query(
    `SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.submission_id = $1 ORDER BY c.created_at DESC`,
    [id]
);
res.json({ comments: result.rows });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch comments' } });
}
});

module.exports = router;