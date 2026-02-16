const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs'); // Add this for password change

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
`SELECT id, username, email, bio, skills, 
        social_links, looking_for_collab, last_active, created_at 
    FROM users WHERE id = $1`,
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
const { username, email, bio, skills, social_links, looking_for_collab } = req.body;

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
    SET username = $1, email = $2, bio = $3, skills = $4, 
        social_links = $5, looking_for_collab = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING id, username, email, bio, skills, social_links, looking_for_collab`,
[username, email, bio, skills || [], social_links || '{}', looking_for_collab !== false, userId]
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
const { username, email, bio, skills, social_links, looking_for_collab } = req.body;

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
    SET username = $1, email = $2, bio = $3, skills = $4, 
        social_links = $5, looking_for_collab = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING id, username, email, bio, skills, social_links, looking_for_collab`,
[username, email, bio, skills || [], social_links || '{}', looking_for_collab !== false, userId]
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

// Change Password endpoint (moved from auth.js to keep user routes together)
router.put('/:userId/password', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const { current_password, new_password } = req.body;

// Make sure user can only change their own password
if (req.user.id !== parseInt(userId)) {
return res.status(403).json({ 
error: { message: 'Unauthorized - You can only change your own password' } 
});
}

// Get user's current password
const userResult = await db.query(
'SELECT password_hash FROM users WHERE id = $1',
[userId]
);

const user = userResult.rows[0];

// Verify current password
const isValid = await bcrypt.compare(current_password, user.password_hash);
if (!isValid) {
return res.status(400).json({ error: { message: 'Current password is incorrect' } });
}

// Hash new password
const hashedPassword = await bcrypt.hash(new_password, 10);

// Update password
await db.query(
'UPDATE users SET password_hash = $1 WHERE id = $2',
[hashedPassword, userId]
);

res.json({ message: 'Password updated successfully' });
} catch (error) {
console.error('Change password error:', error);
res.status(500).json({ error: { message: 'Failed to change password' } });
}
});

// Get public user profile
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

// Validate ID is a number
if (isNaN(parseInt(id))) {
    return res.status(400).json({ error: { message: 'Invalid user ID' } });
}

// Get user basic info
const userResult = await db.query(
    `SELECT id, username, email, bio, skills, social_links, 
            looking_for_collab, last_active, created_at 
    FROM users WHERE id = $1`,
    [id]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

const user = userResult.rows[0];

// Try to get completed collaborations count (if tables exist)
let completedCollabs = 0;
try {
    const collabResult = await db.query(
    `SELECT COUNT(*) as count 
        FROM submissions s
        WHERE s.collaborator_id = $1`,
    [id]
    );
    completedCollabs = parseInt(collabResult.rows[0].count);
} catch (collabError) {
    // Silently fail - tables might not exist yet
    console.log('Note: Collaborations count not available');
}

res.json({
    user: {
    ...user,
    completed_collaborations: completedCollabs
    }
});
} catch (error) {
console.error('❌ Get user error:', error);
res.status(500).json({ 
    error: { message: 'Failed to fetch user' } 
});
}
});

module.exports = router;