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
const { username, email, bio, skills } = req.body;

// Validate required fields
if (!username || !email) {
    return res.status(400).json({ 
    error: { message: 'Username and email are required' } 
    });
}

// Check if email is already taken by another user
if (email) {
    const emailCheck = await db.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [email, userId]
    );

    if (emailCheck.rows.length > 0) {
    return res.status(400).json({ 
        error: { message: 'Email is already taken' } 
    });
    }
}

// Check if username is already taken by another user
if (username) {
    const usernameCheck = await db.query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username, userId]
    );

    if (usernameCheck.rows.length > 0) {
    return res.status(400).json({ 
        error: { message: 'Username is already taken' } 
    });
    }
}

const result = await db.query(
    `UPDATE users 
    SET username = $1, email = $2, bio = $3, skills = $4, updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING id, username, email, bio, skills`,
    [username, email, bio, skills || [], userId]
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

// Update user profile by ID (for EditProfilePage)
router.put('/:userId', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const { username, email, bio, skills } = req.body;

// Make sure user can only edit their own profile
if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ 
    error: { message: 'Unauthorized - You can only edit your own profile' } 
    });
}

// Validate required fields
if (!username || !email) {
    return res.status(400).json({ 
    error: { message: 'Username and email are required' } 
    });
}

// Check if email is already taken by another user
const emailCheck = await db.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [email, userId]
);

if (emailCheck.rows.length > 0) {
    return res.status(400).json({ 
    error: { message: 'Email is already taken' } 
    });
}

// Check if username is already taken by another user
const usernameCheck = await db.query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username, userId]
);

if (usernameCheck.rows.length > 0) {
    return res.status(400).json({ 
    error: { message: 'Username is already taken' } 
    });
}

const result = await db.query(
    `UPDATE users 
    SET username = $1, email = $2, bio = $3, skills = $4, updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING id, username, email, bio, skills`,
    [username, email, bio, skills || [], userId]
);

res.json({
    message: 'Profile updated successfully',
    user: result.rows[0]
});
} catch (error) {
console.error('Update user profile error:', error);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

// Get public user profile
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

const result = await db.query(
    'SELECT id, username, email, bio, skills, created_at FROM users WHERE id = $1',
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