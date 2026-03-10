const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const multer = require('multer');

const router = express.Router();

// S3 setup for avatar uploads
const s3 = new AWS.S3({
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
region: process.env.AWS_REGION || 'eu-north-1',
});
const upload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/* ─────────────────────────────────────────────
POST /api/users/avatar  — upload profile picture
───────────────────────────────────────────── */
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
try {
if (!req.file) return res.status(400).json({ error: { message: 'No file provided' } });

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!allowed.includes(req.file.mimetype)) {
    return res.status(400).json({ error: { message: 'Only JPEG, PNG, WebP or GIF images allowed' } });
}

const ext = req.file.originalname.split('.').pop().toLowerCase();
const key = `avatars/${req.user.id}/${Date.now()}.${ext}`;

await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
}).promise();

const avatarUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;

await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);

res.json({ avatar_url: avatarUrl });
} catch (err) {
console.error('Avatar upload error:', err);
res.status(500).json({ error: { message: 'Failed to upload avatar' } });
}
});

/* ─────────────────────────────────────────────
GET /api/users/profile  — own profile (auth)
───────────────────────────────────────────── */
router.get('/profile', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    `SELECT id, username, email, bio, skills, avatar_url,
            social_links, looking_for_collab, last_active, created_at,
            email_notifications, preferred_genres, equipment
    FROM users WHERE id = $1`,
    [req.user.id]
);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'User not found' } });
res.json({ user: result.rows[0] });
} catch (error) {
console.error('Get profile error:', error);
res.status(500).json({ error: { message: 'Failed to fetch profile' } });
}
});

/* ─────────────────────────────────────────────
PUT /api/users/profile  — update own profile
───────────────────────────────────────────── */
router.put('/profile', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
const { username, email, bio, skills, social_links, looking_for_collab } = req.body;

if (!username || !email) {
    return res.status(400).json({ error: { message: 'Username and email are required' } });
}

const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
if (emailCheck.rows.length > 0) return res.status(400).json({ error: { message: 'Email is already taken' } });

const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
if (usernameCheck.rows.length > 0) return res.status(400).json({ error: { message: 'Username is already taken' } });

const result = await db.query(
    `UPDATE users
    SET username = $1, email = $2, bio = $3, skills = $4,
        social_links = $5, looking_for_collab = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING id, username, email, bio, skills, avatar_url, social_links, looking_for_collab`,
    [username, email, bio, skills || [], social_links || '{}', looking_for_collab !== false, userId]
);

res.json({ message: 'Profile updated', user: result.rows[0] });
} catch (error) {
console.error('Update profile error:', error);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

/* ─────────────────────────────────────────────
PUT /api/users/:userId  — update profile by ID
───────────────────────────────────────────── */
router.put('/:userId', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const { username, email, bio, skills, social_links, looking_for_collab, preferred_genres, equipment } = req.body;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized - You can only edit your own profile' } });
}

if (!username || !email) {
    return res.status(400).json({ error: { message: 'Username and email are required' } });
}

const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
if (emailCheck.rows.length > 0) return res.status(400).json({ error: { message: 'Email is already taken' } });

const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
if (usernameCheck.rows.length > 0) return res.status(400).json({ error: { message: 'Username is already taken' } });

const result = await db.query(
    `UPDATE users
    SET username = $1, email = $2, bio = $3, skills = $4,
        social_links = $5, looking_for_collab = $6,
        preferred_genres = $7, equipment = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING id, username, email, bio, skills, avatar_url, social_links, looking_for_collab, preferred_genres, equipment`,
    [username, email, bio, skills || [], social_links || '{}', looking_for_collab !== false,
    preferred_genres || [], equipment || [], userId]
);

res.json({ message: 'Profile updated successfully', user: result.rows[0] });
} catch (error) {
console.error('Update user profile error:', error);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

/* ─────────────────────────────────────────────
PUT /api/users/:userId/password
───────────────────────────────────────────── */
router.put('/:userId/password', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const { current_password, new_password } = req.body;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
const user = userResult.rows[0];

const isValid = await bcrypt.compare(current_password, user.password_hash);
if (!isValid) return res.status(400).json({ error: { message: 'Current password is incorrect' } });

const hashedPassword = await bcrypt.hash(new_password, 10);
await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

res.json({ message: 'Password updated successfully' });
} catch (error) {
console.error('Change password error:', error);
res.status(500).json({ error: { message: 'Failed to change password' } });
}
});

/* ─────────────────────────────────────────────
GET /api/users/by-username/:username  — public profile by username slug
───────────────────────────────────────────── */
router.get('/by-username/:username', async (req, res) => {
try {
const { username } = req.params;

const userResult = await db.query(
    `SELECT id, username, email, bio, skills, avatar_url, social_links,
            looking_for_collab, last_active, created_at,
            preferred_genres, equipment
    FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

const user = userResult.rows[0];

let completedCollabs = 0;
try {
    const collabResult = await db.query(
    'SELECT COUNT(*) as count FROM submissions s WHERE s.collaborator_id = $1',
    [user.id]
    );
    completedCollabs = parseInt(collabResult.rows[0].count);
} catch (e) {}

res.json({ user: { ...user, completed_collaborations: completedCollabs } });
} catch (error) {
console.error('Get user by username error:', error);
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

/* ─────────────────────────────────────────────
GET /api/users/:id  — public profile by numeric ID (backward compat)
───────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

if (isNaN(parseInt(id))) {
    return res.status(400).json({ error: { message: 'Invalid user ID' } });
}

const userResult = await db.query(
    `SELECT id, username, email, bio, skills, avatar_url, social_links,
            looking_for_collab, last_active, created_at,
            preferred_genres, equipment
    FROM users WHERE id = $1`,
    [id]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

const user = userResult.rows[0];

let completedCollabs = 0;
try {
    const collabResult = await db.query(
    'SELECT COUNT(*) as count FROM submissions s WHERE s.collaborator_id = $1',
    [id]
    );
    completedCollabs = parseInt(collabResult.rows[0].count);
} catch (e) {}

res.json({ user: { ...user, completed_collaborations: completedCollabs } });
} catch (error) {
console.error('Get user error:', error);
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

module.exports = router;