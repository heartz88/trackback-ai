const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get user profile (FR7)
router.get('/profile', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
    'SELECT id, username, email, bio, skills, created_at FROM users WHERE id = $1',
    [userId]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

res.json({ user: result.rows[0] });
} catch (error) {
console.error('Get profile error:', error);
res.status(500).json({ error: { message: 'Failed to fetch profile' } });
}
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
const { bio, skills } = req.body;

const result = await db.query(
    `UPDATE users 
    SET bio = $1, skills = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, username, email, bio, skills`,
    [bio, skills || [], userId]
);

res.json({
    message: 'Profile updated',
    user: result.rows[0]
});
} catch (error) {
console.error('Update profile error:', error);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

// Get public user profile
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

const result = await db.query(
    'SELECT id, username, bio, skills, created_at FROM users WHERE id = $1',
    [id]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

// Get user's completed collaborations
const collaborations = await db.query(
    `SELECT COUNT(*) as count 
    FROM submissions s
    JOIN collaboration_requests cr ON s.track_id = cr.track_id AND s.collaborator_id = cr.collaborator_id
    WHERE s.collaborator_id = $1 AND cr.status = 'approved'`,
    [id]
);

res.json({
    user: {
    ...result.rows[0],
    completed_collaborations: parseInt(collaborations.rows[0].count)
    }
});
} catch (error) {
console.error('Get user error:', error);
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

module.exports = router;