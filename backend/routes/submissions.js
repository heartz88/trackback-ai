const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { uploadToS3, getSignedUrl } = require('../config/s3');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
storage,
limits: { fileSize: 50 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-wav'];
if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
} else {
    cb(new Error('Invalid file type'));
}
}
});

// Submit completed version (FR5)
router.post('/', authMiddleware, upload.single('audio'), async (req, res) => {
try {
const { track_id, title, description } = req.body;
const collaboratorId = req.user.id;

if (!req.file) {
    return res.status(400).json({ error: { message: 'No audio file provided' } });
}

// Verify collaboration is approved
const collabCheck = await db.query(
    `SELECT cr.id 
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    WHERE cr.track_id = $1 AND cr.collaborator_id = $2 AND cr.status = 'approved'`,
    [track_id, collaboratorId]
);

if (collabCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'No approved collaboration found' } });
}

// Upload to S3
const timestamp = Date.now();
const fileExt = req.file.originalname.split('.').pop();
const s3Key = `submissions/${track_id}/${collaboratorId}/${timestamp}.${fileExt}`;

await uploadToS3(req.file, s3Key);

// Create submission
const result = await db.query(
    `INSERT INTO submissions (track_id, collaborator_id, title, description, s3_key, file_format)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [track_id, collaboratorId, title, description, s3Key, fileExt]
);

// Get track owner for notification
const trackOwner = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1',
    [track_id]
);

// Create notification
await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'submission', $2, $3)`,
    [
    trackOwner.rows[0].user_id,
    `${req.user.username} submitted a completed version of "${trackOwner.rows[0].title}"`,
    result.rows[0].id
    ]
);

res.status(201).json({
    message: 'Submission uploaded successfully',
    submission: {
    ...result.rows[0],
    audio_url: getSignedUrl(s3Key)
    }
});
} catch (error) {
console.error('Submit error:', error);
res.status(500).json({ error: { message: 'Failed to submit' } });
}
});

// Get submissions for a track
router.get('/track/:trackId', async (req, res) => {
try {
const { trackId } = req.params;

const result = await db.query(
    `SELECT s.*, u.username as collaborator_name
    FROM submissions s
    JOIN users u ON s.collaborator_id = u.id
    WHERE s.track_id = $1
    ORDER BY (s.upvotes - s.downvotes) DESC, s.created_at DESC`,
    [trackId]
);

const submissions = result.rows.map(sub => ({
    ...sub,
    audio_url: getSignedUrl(sub.s3_key),
    score: sub.upvotes - sub.downvotes
}));

res.json({ submissions });
} catch (error) {
console.error('Get submissions error:', error);
res.status(500).json({ error: { message: 'Failed to fetch submissions' } });
}
});

// Vote on submission (FR5)
router.post('/:id/vote', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const { vote_type } = req.body; // 'upvote' or 'downvote'
const userId = req.user.id;

if (!['upvote', 'downvote'].includes(vote_type)) {
    return res.status(400).json({ error: { message: 'Invalid vote type' } });
}

// Check if already voted
const existingVote = await db.query(
    'SELECT id, vote_type FROM votes WHERE submission_id = $1 AND user_id = $2',
    [id, userId]
);

const client = await db.pool.connect();

try {
    await client.query('BEGIN');

    if (existingVote.rows.length > 0) {
    const oldVote = existingVote.rows[0].vote_type;

    // Remove old vote count
    if (oldVote === 'upvote') {
        await client.query('UPDATE submissions SET upvotes = upvotes - 1 WHERE id = $1', [id]);
    } else {
        await client.query('UPDATE submissions SET downvotes = downvotes - 1 WHERE id = $1', [id]);
    }

    // Update vote
    await client.query(
        'UPDATE votes SET vote_type = $1 WHERE submission_id = $2 AND user_id = $3',
        [vote_type, id, userId]
    );
    } else {
    // Insert new vote
    await client.query(
        'INSERT INTO votes (submission_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [id, userId, vote_type]
    );
    }

    // Add new vote count
    if (vote_type === 'upvote') {
    await client.query('UPDATE submissions SET upvotes = upvotes + 1 WHERE id = $1', [id]);
    } else {
    await client.query('UPDATE submissions SET downvotes = downvotes + 1 WHERE id = $1', [id]);
    }

    await client.query('COMMIT');

    res.json({ message: 'Vote recorded' });
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
} catch (error) {
console.error('Vote error:', error);
res.status(500).json({ error: { message: 'Failed to record vote' } });
}
});

// Add comment to submission (FR5)
router.post('/:id/comments', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const { content } = req.body;
const userId = req.user.id;

const result = await db.query(
    `INSERT INTO comments (submission_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [id, userId, content]
);

// Get submission details for notification
const submission = await db.query(
    'SELECT collaborator_id FROM submissions WHERE id = $1',
    [id]
);

// Notify submission owner
if (submission.rows[0].collaborator_id !== userId) {
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
        VALUES ($1, 'comment', $2, $3)`,
    [
        submission.rows[0].collaborator_id,
        `${req.user.username} commented on your submission`,
        result.rows[0].id
    ]
    );
}

res.status(201).json({
    message: 'Comment added',
    comment: result.rows[0]
});
} catch (error) {
console.error('Comment error:', error);
res.status(500).json({ error: { message: 'Failed to add comment' } });
}
});

// Get comments for submission
router.get('/:id/comments', async (req, res) => {
try {
const { id } = req.params;

const result = await db.query(
    `SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.submission_id = $1
    ORDER BY c.created_at DESC`,
    [id]
);

res.json({ comments: result.rows });
} catch (error) {
console.error('Get comments error:', error);
res.status(500).json({ error: { message: 'Failed to fetch comments' } });
}
});

module.exports = router;