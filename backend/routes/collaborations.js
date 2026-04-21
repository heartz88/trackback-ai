const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { getSignedUrl } = require('../config/s3');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const onlineUsers = require('../config/onlineUsers');

const router = express.Router();

const resignAvatar = (row) => row.avatar_s3_key ? getSignedUrl(row.avatar_s3_key) : row.avatar_url;

// POST /request — Request collaboration
router.post('/request', authMiddleware, async (req, res) => {
try {
const { track_id, message } = req.body;
const collaboratorId = req.user.id;

const trackResult = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1 AND status = $2',
    [track_id, 'open']
);
if (trackResult.rows.length === 0)
    return res.status(404).json({ error: { message: 'Track not found or not available' } });
if (trackResult.rows[0].user_id === collaboratorId)
    return res.status(400).json({ error: { message: 'Cannot collaborate on your own track' } });

const existing = await db.query(
    'SELECT id FROM collaboration_requests WHERE track_id = $1 AND collaborator_id = $2',
    [track_id, collaboratorId]
);
if (existing.rows.length > 0)
    return res.status(400).json({ error: { message: 'Request already sent' } });

const result = await db.query(
    `INSERT INTO collaboration_requests (track_id, collaborator_id, message, status)
    VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [track_id, collaboratorId, message]
);

await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'collaboration_request', $2, $3)`,
    [trackResult.rows[0].user_id, `${req.user.username} wants to collaborate on your track "${trackResult.rows[0].title}"`, result.rows[0].id]
);

const ownerId = parseInt(trackResult.rows[0].user_id);
if (!onlineUsers?.has(ownerId)) {
    triggerNotificationEmail(db, ownerId, 'collaboration_request', {
    senderName: req.user.username, trackTitle: trackResult.rows[0].title
    });
}

// Auto-create conversation if none exists
try {
    const convCheck = await db.query(
    `SELECT c.id FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE cp1.user_id = $1 AND cp2.user_id = $2`,
    [trackResult.rows[0].user_id, collaboratorId]
    );
    if (convCheck.rows.length === 0) {
    const conv = await db.query('INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id');
    const conversationId = conv.rows[0].id;
    await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at)
        VALUES ($1, $2, NOW(), NOW()), ($1, $3, NOW(), NOW())`,
        [conversationId, trackResult.rows[0].user_id, collaboratorId]
    );
    await db.query('UPDATE collaboration_requests SET conversation_id = $1 WHERE id = $2', [conversationId, result.rows[0].id]);
    }
} catch (_) {}

res.status(201).json({ message: 'Collaboration request sent', request: result.rows[0] });
} catch (error) {
console.error('Request collaboration error:', error);
res.status(500).json({ error: { message: 'Failed to send request' } });
}
});

// GET /track/:trackId — Current user's status on a track
router.get('/track/:trackId', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    `SELECT cr.*, t.title as track_title, t.user_id as owner_id
    FROM collaboration_requests cr JOIN tracks t ON cr.track_id = t.id
    WHERE cr.track_id = $1 AND cr.collaborator_id = $2`,
    [req.params.trackId, req.user.id]
);
res.json({ collaboration: result.rows[0] || null });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch collaboration status' } });
}
});

// GET /track/:trackId/active — Approved collaborators for a track
router.get('/track/:trackId/active', async (req, res) => {
try {
const result = await db.query(
    `SELECT cr.*, u.id as collaborator_id, u.username as collaborator_name, u.avatar_url, u.avatar_s3_key
    FROM collaboration_requests cr JOIN users u ON cr.collaborator_id = u.id
    WHERE cr.track_id = $1 AND cr.status = 'approved'
    ORDER BY cr.updated_at DESC`,
    [req.params.trackId]
);
const collaborators = result.rows.map(c => ({
    id: c.collaborator_id, username: c.collaborator_name,
    avatar_url: resignAvatar(c), role: c.role || 'Collaborator', joined_at: c.updated_at
}));
res.json({ collaborators, count: collaborators.length });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch collaborators' } });
}
});

// GET /requests/received — Requests on the user's tracks
router.get('/requests/received', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    `SELECT cr.*, t.title as track_title, t.s3_key as track_file,
            u.username as collaborator_name, u.email as collaborator_email,
            u.avatar_url, u.avatar_s3_key, c.id as conversation_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    JOIN users u ON cr.collaborator_id = u.id
    LEFT JOIN conversations c ON cr.conversation_id = c.id
    WHERE t.user_id = $1
    ORDER BY cr.created_at DESC`,
    [req.user.id]
);
res.json({ requests: result.rows.map(r => ({ ...r, avatar_url: resignAvatar(r), track_audio_url: getSignedUrl(r.track_file) })) });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch requests' } });
}
});

// GET /requests/sent — Requests sent by the user
router.get('/requests/sent', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    `SELECT cr.*, t.title as track_title, u.username as owner_name,
            u.email as owner_email, u.avatar_url, u.avatar_s3_key, c.id as conversation_id
    FROM collaboration_requests cr
    JOIN tracks t ON cr.track_id = t.id
    JOIN users u ON t.user_id = u.id
    LEFT JOIN conversations c ON cr.conversation_id = c.id
    WHERE cr.collaborator_id = $1
    ORDER BY cr.created_at DESC`,
    [req.user.id]
);
res.json({ requests: result.rows.map(r => ({ ...r, avatar_url: resignAvatar(r) })) });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to fetch requests' } });
}
});

// PUT /requests/:id — Approve or reject
router.put('/requests/:id', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const { status } = req.body;
const userId = req.user.id;

if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ error: { message: 'Invalid status' } });

const result = await db.query(
    `SELECT cr.*, t.user_id, t.title, cr.collaborator_id, cr.conversation_id
    FROM collaboration_requests cr JOIN tracks t ON cr.track_id = t.id WHERE cr.id = $1`,
    [id]
);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'Request not found' } });

const request = result.rows[0];
if (request.user_id !== userId) return res.status(403).json({ error: { message: 'Unauthorized' } });

await db.query('UPDATE collaboration_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

if (status === 'approved') {
    await db.query(
    `INSERT INTO active_collaborations (track_id, owner_id, collaborator_id, conversation_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (track_id, collaborator_id) DO UPDATE SET status = 'active', updated_at = NOW()`,
    [request.track_id, userId, request.collaborator_id, request.conversation_id]
    );
    if (request.conversation_id) {
    await db.query(
        `INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, NOW())`,
        [request.conversation_id, userId, `🎵 Collaboration approved! You can now work together on "${request.title}". Use this chat to coordinate.`]
    );
    }
}

await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'collaboration_response', $2, $3)`,
    [request.collaborator_id, `Your collaboration request for "${request.title}" was ${status}`, id]
);

const collaboratorId = parseInt(request.collaborator_id);
if (!onlineUsers?.has(collaboratorId)) {
    triggerNotificationEmail(db, collaboratorId, 'collaboration_response', {
    responderName: req.user.username, trackTitle: request.title, status
    });
}

res.json({ message: `Request ${status}`, conversation_id: request.conversation_id });
} catch (error) {
console.error('Update request error:', error);
res.status(500).json({ error: { message: 'Failed to update request' } });
}
});

// GET /user/:userId — All collaborations for a user (profile page)
router.get('/user/:userId', async (req, res) => {
try {
const { userId } = req.params;
if (isNaN(parseInt(userId))) return res.status(400).json({ error: { message: 'Invalid user ID' } });

const result = await db.query(
    `SELECT ac.*, t.title as track_title,
            u.username as collaborator_name, u.avatar_url, u.avatar_s3_key,
            owner.username as owner_name, owner.avatar_url as owner_avatar_url, owner.avatar_s3_key as owner_avatar_s3_key
    FROM active_collaborations ac
    JOIN tracks t ON ac.track_id = t.id
    JOIN users u ON ac.collaborator_id = u.id
    JOIN users owner ON ac.owner_id = owner.id
    WHERE ac.owner_id = $1 OR ac.collaborator_id = $1
    ORDER BY ac.created_at DESC`,
    [userId]
);

const collaborations = result.rows.map(c => ({
    ...c,
    avatar_url: resignAvatar(c),
    owner_avatar_url: c.owner_avatar_s3_key ? getSignedUrl(c.owner_avatar_s3_key) : c.owner_avatar_url
}));

res.json({ collaborations });
} catch (error) {
if (error.code === '42P01') return res.json({ collaborations: [] });
res.status(500).json({ error: { message: 'Failed to fetch collaborations' } });
}
});

// DELETE /requests/:id — Cancel a pending request
router.delete('/requests/:id', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    'SELECT id, collaborator_id, status FROM collaboration_requests WHERE id = $1',
    [req.params.id]
);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'Request not found' } });
if (result.rows[0].collaborator_id !== req.user.id) return res.status(403).json({ error: { message: 'You can only cancel your own requests' } });
if (result.rows[0].status !== 'pending') return res.status(400).json({ error: { message: 'Only pending requests can be cancelled' } });

await db.query('DELETE FROM collaboration_requests WHERE id = $1', [req.params.id]);
res.json({ message: 'Request cancelled' });
} catch (error) {
res.status(500).json({ error: { message: 'Failed to cancel request' } });
}
});

module.exports = router;