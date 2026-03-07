const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
`SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 50`,
[userId]
);

res.json({ notifications: result.rows });
} catch (error) {
console.error('Get notifications error:', error);
res.status(500).json({ error: { message: 'Failed to fetch notifications' } });
}
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const userId = req.user.id;

await db.query(
'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
[id, userId]
);

res.json({ message: 'Notification marked as read' });
} catch (error) {
console.error('Mark read error:', error);
res.status(500).json({ error: { message: 'Failed to mark notification' } });
}
});

// Mark all as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

await db.query(
'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
[userId]
);

res.json({ message: 'All notifications marked as read' });
} catch (error) {
console.error('Mark all read error:', error);
res.status(500).json({ error: { message: 'Failed to mark notifications' } });
}
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
[userId]
);

res.json({ count: parseInt(result.rows[0].count) });
} catch (error) {
console.error('Get unread count error:', error);
res.status(500).json({ error: { message: 'Failed to get count' } });
}
});

module.exports = router;

/* ─────────────────────────────────────────────
Email preferences endpoints (mounted on /notifications)
GET  /notifications/email-preferences
PUT  /notifications/email-preferences
───────────────────────────────────────────── */

router.get('/email-preferences', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    'SELECT email_notifications FROM users WHERE id = $1',
    [req.user.id]
);
const prefs = result.rows[0]?.email_notifications || {
    enabled: true,
    collaboration_request: true,
    collaboration_response: true,
    submission: true,
    vote: false,
    comment: true,
    message: false,
};
res.json({ preferences: prefs });
} catch (error) {
console.error('Get email prefs error:', error);
res.status(500).json({ error: { message: 'Failed to fetch email preferences' } });
}
});

router.put('/email-preferences', authMiddleware, async (req, res) => {
try {
const allowed = ['enabled', 'collaboration_request', 'collaboration_response', 'submission', 'vote', 'comment', 'message'];
const prefs = {};
allowed.forEach(key => {
    if (typeof req.body[key] === 'boolean') prefs[key] = req.body[key];
});

if (Object.keys(prefs).length === 0) {
    return res.status(400).json({ error: { message: 'No valid preference fields provided' } });
}

// Merge with existing prefs so we only update what's sent
const existing = await db.query('SELECT email_notifications FROM users WHERE id = $1', [req.user.id]);
const current = existing.rows[0]?.email_notifications || {};
const merged = { ...current, ...prefs };

await db.query(
    'UPDATE users SET email_notifications = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [JSON.stringify(merged), req.user.id]
);

res.json({ message: 'Email preferences updated', preferences: merged });
} catch (error) {
console.error('Update email prefs error:', error);
res.status(500).json({ error: { message: 'Failed to update email preferences' } });
}
});

// TEMPORARY TEST ROUTE — remove before submission
router.get('/test-email', authMiddleware, async (req, res) => {
const { triggerNotificationEmail } = require('../config/emailTrigger');
await triggerNotificationEmail(
db,
req.user.id,
'collaboration_request',
{
    senderName: 'TestUser',
    trackTitle: 'My Unfinished Loop',
}
);
res.json({ message: 'Test email sent — check your inbox' });
});

module.exports = router;