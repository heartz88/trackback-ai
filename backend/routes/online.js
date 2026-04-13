const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { getSignedUrl } = require('../config/s3');

const router = express.Router();

// Get online users (for messaging)
router.get('/online-users', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

// Get users who are currently online (EXCLUDING CURRENT USER)
const result = await db.query(
    `SELECT u.id, u.username, u.email, u.bio, u.skills, u.avatar_url, u.avatar_s3_key, ou.last_activity
    FROM users u
    JOIN online_users ou ON u.id = ou.user_id
    WHERE u.id != $1
    ORDER BY ou.last_activity DESC`,
    [userId]
);

// Also get recent active users (last 5 minutes) who might not be in online_users table
const recentUsers = await db.query(
    `SELECT DISTINCT u.id, u.username, u.email, u.bio, u.skills, u.avatar_url, u.avatar_s3_key
    FROM users u
    WHERE u.id != $1
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp
        JOIN conversations c ON cp.conversation_id = c.id
        WHERE cp.user_id = u.id
        AND c.updated_at > NOW() - INTERVAL '5 minutes'
    )
    LIMIT 20`,
    [userId]
);

// Merge results
const onlineUsers = result.rows.map(user => ({
    ...user,
    avatar_url: user.avatar_s3_key ? getSignedUrl(user.avatar_s3_key) : user.avatar_url,
    is_online: true,
    last_activity: user.last_activity
}));

const recentUserIds = new Set(onlineUsers.map(u => u.id));
const activeUsers = recentUsers.rows
    .filter(user => !recentUserIds.has(user.id))
    .map(user => ({
        ...user,
        avatar_url: user.avatar_s3_key ? getSignedUrl(user.avatar_s3_key) : user.avatar_url,
        is_online: false,
        last_activity: null
    }));

res.json({
    online_users: onlineUsers,
    recent_users: activeUsers,
    total_online: onlineUsers.length,
    total_recent: activeUsers.length
});
} catch (error) {
console.error('Error getting online users:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch online users',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Check if user is online
router.get('/online-status/:userId', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const currentUserId = req.user.id;

if (parseInt(userId) === currentUserId) {
    return res.json({
    is_online: true,
    is_current_user: true,
    message: 'This is your own account'
    });
}

const result = await db.query(
    'SELECT 1 FROM online_users WHERE user_id = $1',
    [userId]
);

const isOnline = result.rows.length > 0;

res.json({
    is_online: isOnline,
    user_id: parseInt(userId),
    checked_at: new Date().toISOString()
});
} catch (error) {
console.error('Error checking online status:', error);
res.status(500).json({
    error: {
    message: 'Failed to check online status',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

module.exports = router;