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