const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const multer = require('multer');
const { uploadToS3, getSignedUrl } = require('../config/s3');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
storage,
limits: { fileSize: 50 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
const allowedTypes = [
    'audio/mpeg', 
    'audio/wav', 
    'audio/flac', 
    'audio/x-wav',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac'
];
if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
} else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
}
}
});

// Request collaboration
router.post('/request', authMiddleware, async (req, res) => {
try {
const { track_id, message } = req.body;
const collaboratorId = req.user.id;

// Check if track exists
const trackResult = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1 AND status = $2',
    [track_id, 'open']
);

if (trackResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found or not available' } });
}

// Can't request collaboration on own track
if (trackResult.rows[0].user_id === collaboratorId) {
    return res.status(400).json({ error: { message: 'Cannot collaborate on your own track' } });
}

// Check if request already exists
const existingRequest = await db.query(
    'SELECT id FROM collaboration_requests WHERE track_id = $1 AND collaborator_id = $2',
    [track_id, collaboratorId]
);

if (existingRequest.rows.length > 0) {
    return res.status(400).json({ error: { message: 'Request already sent' } });
}

// Create request
const result = await db.query(
    `INSERT INTO collaboration_requests (track_id, collaborator_id, message, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *`,
    [track_id, collaboratorId, message]
);

// Create notification for track owner
await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'collaboration_request', $2, $3)`,
    [
    trackResult.rows[0].user_id,
    `${req.user.username} wants to collaborate on your track "${trackResult.rows[0].title}"`,
    result.rows[0].id
    ]
);

// AUTO-CREATE MESSAGING CONVERSATION WHEN COLLABORATION IS REQUESTED
try {
    // Check if conversation already exists between these users
    const convCheck = await db.query(
    `SELECT c.id as conversation_id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE cp1.user_id = $1 AND cp2.user_id = $2`,
    [trackResult.rows[0].user_id, collaboratorId]
    );

    if (convCheck.rows.length === 0) {
    // Create new conversation
    const convResult = await db.query(
        'INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id',
        []
    );
    
    const conversationId = convResult.rows[0].id;
    
    // Add both users as participants
    await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at) 
        VALUES ($1, $2, NOW(), NOW()), ($1, $3, NOW(), NOW())`,
        [conversationId, trackResult.rows[0].user_id, collaboratorId]
    );

    // Store conversation ID in collaboration request
    await db.query(
        'UPDATE collaboration_requests SET conversation_id = $1 WHERE id = $2',
        [conversationId, result.rows[0].id]
    );

    console.log(`✅ Auto-created conversation ${conversationId} for collaboration request ${result.rows[0].id}`);
    }
} catch (convError) {
    console.warn('⚠️ Could not auto-create conversation:', convError.message);
    // Non-critical error, continue
}

res.status(201).json({
    message: 'Collaboration request sent',
    request: result.rows[0]
});
} catch (error) {
console.error('Request collaboration error:', error);
res.status(500).json({ error: { message: 'Failed to send request' } });
}
});

// Get collaboration requests for user's tracks
router.get('/requests/received', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
    `SELECT cr.*, 
            t.title as track_title, 
            t.s3_key as track_file,
            u.username as collaborator_name,
            u.email as collaborator_email,
            c.id as conversation_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    JOIN users u ON cr.collaborator_id = u.id
    LEFT JOIN conversations c ON cr.conversation_id = c.id
    WHERE t.user_id = $1
    ORDER BY cr.created_at DESC`,
    [userId]
);

res.json({ 
    requests: result.rows.map(req => ({
    ...req,
    track_audio_url: getSignedUrl(req.track_file)
    }))
});
} catch (error) {
console.error('Get requests error:', error);
res.status(500).json({ error: { message: 'Failed to fetch requests' } });
}
});

// Get sent collaboration requests
router.get('/requests/sent', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
    `SELECT cr.*, 
            t.title as track_title, 
            u.username as owner_name,
            u.email as owner_email,
            c.id as conversation_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    JOIN users u ON t.user_id = u.id
    LEFT JOIN conversations c ON cr.conversation_id = c.id
    WHERE cr.collaborator_id = $1
    ORDER BY cr.created_at DESC`,
    [userId]
);

res.json({ requests: result.rows });
} catch (error) {
console.error('Get sent requests error:', error);
res.status(500).json({ error: { message: 'Failed to fetch requests' } });
}
});

// Approve/reject collaboration request
router.put('/requests/:id', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const { status } = req.body; // 'approved' or 'rejected'
const userId = req.user.id;

if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: { message: 'Invalid status' } });
}

// Verify user owns the track
const result = await db.query(
    `SELECT cr.*, t.user_id, t.title, cr.collaborator_id, cr.conversation_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    WHERE cr.id = $1`,
    [id]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Request not found' } });
}

const request = result.rows[0];

if (request.user_id !== userId) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

// Update request status
await db.query(
    'UPDATE collaboration_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, id]
);

// If approved, update track status and create active collaboration
if (status === 'approved') {
    await db.query(
    'UPDATE tracks SET status = $1 WHERE id = $2',
    ['in_progress', request.track_id]
    );

    // Create active collaboration record
    await db.query(
    `INSERT INTO active_collaborations (track_id, owner_id, collaborator_id, conversation_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (track_id, collaborator_id) DO UPDATE SET status = 'active', updated_at = NOW()`,
    [request.track_id, userId, request.collaborator_id, request.conversation_id]
    );

    // Send welcome message in conversation if exists
    if (request.conversation_id) {
    await db.query(
        `INSERT INTO messages (conversation_id, sender_id, content, created_at)
        VALUES ($1, $2, $3, NOW())`,
        [
        request.conversation_id,
        userId,
        `🎵 Collaboration approved! You can now work together on "${request.title}". Use this chat to coordinate.`
        ]
    );
    }
}

// Create notification
await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'collaboration_response', $2, $3)`,
    [
    request.collaborator_id,
    `Your collaboration request for "${request.title}" was ${status}`,
    id
    ]
);

res.json({ 
    message: `Request ${status}`,
    conversation_id: request.conversation_id 
});
} catch (error) {
console.error('Update request error:', error);
res.status(500).json({ error: { message: 'Failed to update request' } });
}
});

// Upload final completed track (NEW ENDPOINT)
router.post('/:trackId/submit', authMiddleware, upload.single('audio'), async (req, res) => {
try {
const { trackId } = req.params;
const userId = req.user.id;
const { title, description } = req.body;

if (!req.file) {
    return res.status(400).json({ error: { message: 'No audio file provided' } });
}

// Verify user is approved collaborator for this track
const collaborationCheck = await db.query(
    `SELECT cr.*, t.title as track_title, t.user_id as owner_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    WHERE cr.track_id = $1 
    AND cr.collaborator_id = $2 
    AND cr.status = 'approved'`,
    [trackId, userId]
);

if (collaborationCheck.rows.length === 0) {
    return res.status(403).json({ 
    error: { message: 'Not authorized to submit to this track' } 
    });
}

const collaboration = collaborationCheck.rows[0];

// Generate unique S3 key for submission
const timestamp = Date.now();
const originalName = req.file.originalname;
const fileExt = originalName.split('.').pop().toLowerCase();
const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
const s3Key = `submissions/${trackId}/${userId}/${timestamp}_${safeFileName}`;

// Upload to S3
const s3Result = await uploadToS3(req.file, s3Key);
console.log(`✅ Submission uploaded to S3: ${s3Result.Location}`);

// Create submission record
const submissionResult = await db.query(
    `INSERT INTO submissions (
    track_id, 
    collaborator_id, 
    title, 
    description, 
    s3_key, 
    file_format,
    status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending_review')
    RETURNING *`,
    [
    trackId,
    userId,
    title || `Submission by ${req.user.username}`,
    description || null,
    s3Key,
    fileExt
    ]
);

const submission = submissionResult.rows[0];

// Create notification for track owner
await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'submission', $2, $3)`,
    [
    collaboration.owner_id,
    `${req.user.username} submitted a completed version for "${collaboration.track_title}"`,
    submission.id
    ]
);

// Send message in conversation if exists
if (collaboration.conversation_id) {
    await db.query(
    `INSERT INTO messages (conversation_id, sender_id, content, created_at)
        VALUES ($1, $2, $3, NOW())`,
    [
        collaboration.conversation_id,
        userId,
        `✅ I've submitted the completed track: "${title || 'Submission'}"`
    ]
    );
}

res.status(201).json({
    message: 'Submission uploaded successfully',
    submission: {
    ...submission,
    audio_url: getSignedUrl(s3Key)
    }
});
} catch (error) {
console.error('Submit track error:', error);
res.status(500).json({ 
    error: { 
    message: 'Failed to submit track',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    } 
});
}
});

// Get submissions for a track
router.get('/:trackId/submissions', authMiddleware, async (req, res) => {
try {
const { trackId } = req.params;
const userId = req.user.id;

// Verify user has access to this track
const accessCheck = await db.query(
    `SELECT user_id FROM tracks WHERE id = $1`,
    [trackId]
);

if (accessCheck.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found' } });
}

const isOwner = accessCheck.rows[0].user_id === userId;
const isCollaborator = await db.query(
    `SELECT 1 FROM collaboration_requests 
    WHERE track_id = $1 AND collaborator_id = $2 AND status = 'approved'`,
    [trackId, userId]
);

if (!isOwner && isCollaborator.rows.length === 0) {
    return res.status(403).json({ 
    error: { message: 'Not authorized to view submissions' } 
    });
}

const result = await db.query(
    `SELECT s.*,
            u.username as collaborator_name,
            t.user_id  as track_owner_id,
            (SELECT COUNT(*) FROM votes WHERE submission_id = s.id AND vote_type = 'upvote')   AS upvotes,
            (SELECT COUNT(*) FROM votes WHERE submission_id = s.id AND vote_type = 'downvote') AS downvotes,
            (SELECT vote_type FROM votes WHERE submission_id = s.id AND user_id = $2 LIMIT 1)  AS user_vote,
            COALESCE(s.version_number, 1) AS version_number
    FROM submissions s
    JOIN users u ON s.collaborator_id = u.id
    JOIN tracks t ON s.track_id = t.id
    WHERE s.track_id = $1
    ORDER BY s.created_at DESC`,
    [trackId, userId]
);

const submissions = result.rows.map(sub => ({
    ...sub,
    audio_url:      getSignedUrl(sub.s3_key),
    can_vote:       !isOwner && sub.collaborator_id !== userId,
    user_vote:      sub.user_vote || null,
    version_number: parseInt(sub.version_number) || 1,
}));

res.json({ submissions });
} catch (error) {
console.error('Get submissions error:', error);
res.status(500).json({ error: { message: 'Failed to fetch submissions' } });
}
});

// Vote on submission — upvote only, toggles on second click
router.post('/submissions/:submissionId/vote', authMiddleware, async (req, res) => {
try {
const { submissionId } = req.params;
const userId = req.user.id;

// Get submission + track owner
const submissionResult = await db.query(
    `SELECT s.*, t.user_id as track_owner_id
    FROM submissions s
    JOIN tracks t ON s.track_id = t.id
    WHERE s.id = $1`,
    [submissionId]
);

if (submissionResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
}

const submission = submissionResult.rows[0];

// Block owner and self-votes
if (userId === submission.track_owner_id) {
    return res.status(403).json({ error: { message: 'Track owners choose the winner — voting not available' } });
}
if (userId === submission.collaborator_id) {
    return res.status(403).json({ error: { message: 'You cannot vote on your own submission' } });
}

// Check for existing vote
const existingVote = await db.query(
    'SELECT id FROM votes WHERE submission_id = $1 AND user_id = $2',
    [submissionId, userId]
);

let vote = null;

if (existingVote.rows.length > 0) {
    // Toggle off — remove the like
    await db.query('DELETE FROM votes WHERE id = $1', [existingVote.rows[0].id]);
    vote = null;
} else {
    // Insert upvote
    await db.query(
    `INSERT INTO votes (submission_id, user_id, vote_type) VALUES ($1, $2, 'upvote')`,
    [submissionId, userId]
    );
    vote = 'upvote';

    // Notify submitter
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'vote', $2, $3)`,
    [submission.collaborator_id, 'Someone liked your submission', submissionId]
    );
}

// Return fresh count
const countResult = await db.query(
    `SELECT COUNT(*)::int AS upvotes FROM votes WHERE submission_id = $1`,
    [submissionId]
);

res.json({
    message: vote ? 'Vote recorded' : 'Vote removed',
    vote,
    upvotes: countResult.rows[0].upvotes
});
} catch (error) {
console.error('Vote error:', error);
res.status(500).json({ error: { message: 'Failed to vote' } });
}
});

// Mark track as completed (after voting)
router.post('/:trackId/complete', authMiddleware, async (req, res) => {
try {
const { trackId } = req.params;
const { submissionId } = req.body;
const userId = req.user.id;

// Verify user is track owner
const trackResult = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1',
    [trackId]
);

if (trackResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found' } });
}

if (trackResult.rows[0].user_id !== userId) {
    return res.status(403).json({ error: { message: 'Only track owner can complete track' } });
}

// Get winning submission (highest votes)
const winningSubResult = await db.query(
    `SELECT s.id, s.title, s.s3_key, u.username
    FROM submissions s
    JOIN users u ON s.collaborator_id = u.id
    WHERE s.track_id = $1
    ORDER BY (
        (SELECT COUNT(*) FROM votes WHERE submission_id = s.id AND vote_type = 'upvote') -
        (SELECT COUNT(*) FROM votes WHERE submission_id = s.id AND vote_type = 'downvote')
    ) DESC
    LIMIT 1`,
    [trackId]
);

if (winningSubResult.rows.length === 0) {
    return res.status(400).json({ error: { message: 'No submissions to complete' } });
}

const winningSubmission = winningSubResult.rows[0];

// Update track status
await db.query(
    `UPDATE tracks
    SET status = 'completed',
        completed_submission_id = $1,
        updated_at = NOW()
    WHERE id = $2`,
    [winningSubmission.id, trackId]
);

// Create notification for collaborator
await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
    VALUES ($1, 'track_completed', $2, $3)`,
    [
    userId,
    `Your submission was selected as the final version for "${trackResult.rows[0].title}"!`,
    trackId
    ]
);

res.json({
    message: 'Track marked as completed',
    winning_submission: {
    id: winningSubmission.id,
    title: winningSubmission.title,
    collaborator: winningSubmission.username,
    audio_url: getSignedUrl(winningSubmission.s3_key)
    }
});
} catch (error) {
console.error('Complete track error:', error);
res.status(500).json({ error: { message: 'Failed to complete track' } });
}
});

router.get('/user/:userId', async (req, res) => {
try {
const { userId } = req.params;

// Validate user ID
if (isNaN(parseInt(userId))) {
    return res.status(400).json({ error: { message: 'Invalid user ID' } });
}

// Get active collaborations where user is either owner or collaborator
const result = await db.query(
    `SELECT ac.*,
            t.title as track_title,
            u.username as collaborator_name,
            owner.username as owner_name
    FROM active_collaborations ac
    JOIN tracks t ON ac.track_id = t.id
    JOIN users u ON ac.collaborator_id = u.id
    JOIN users owner ON ac.owner_id = owner.id
    WHERE ac.owner_id = $1 OR ac.collaborator_id = $1
    ORDER BY ac.created_at DESC`,
    [userId]
);

res.json({ collaborations: result.rows });
} catch (error) {
console.error('❌ Get user collaborations error:', error);
// If table doesn't exist yet, return empty array
if (error.code === '42P01') {
    return res.json({ collaborations: [] });
}
res.status(500).json({
    error: { message: 'Failed to fetch collaborations' }
});
}
});

module.exports = router;