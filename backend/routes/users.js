const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { uploadToS3, getSignedUrl } = require('../config/s3');

const router = express.Router();

// ── Multer config for avatar (images only, 5 MB max) ──────────────────────
const avatarUpload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 5 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
cb(ok ? null : new Error('Only JPEG, PNG, WebP or GIF images are allowed'), ok);
},
});

// ── Helper: columns we always return for a user ───────────────────────────
const USER_COLS = `
id, username, email, bio, skills, social_links,
looking_for_collab, last_active, created_at,
avatar_url, avatar_s3_key,
preferred_genres, equipment
`;

// ════════════════════════════════════════════════════════════════════════════
// POST /users/:userId/avatar  — upload profile picture
// ════════════════════════════════════════════════════════════════════════════
router.post('/:userId/avatar', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
try {
const { userId } = req.params;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

if (!req.file) {
    return res.status(400).json({ error: { message: 'No image file provided' } });
}

// Build a stable S3 key — overwrite the old avatar on each upload
const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
const s3Key = `avatars/${userId}/profile.${ext}`;

// Upload to S3 (reuses existing helper)
await uploadToS3(req.file, s3Key);

// Generate a signed URL (same pattern as audio files)
const avatarUrl = getSignedUrl(s3Key);

// Persist to DB
const result = await db.query(
    `UPDATE users
        SET avatar_url = $1, avatar_s3_key = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING ${USER_COLS}`,
    [avatarUrl, s3Key, userId]
);

res.json({ message: 'Avatar updated', user: result.rows[0], avatar_url: avatarUrl });
} catch (err) {
console.error('Avatar upload error:', err);
res.status(500).json({ error: { message: err.message || 'Failed to upload avatar' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /users/:userId/avatar  — remove profile picture
// ════════════════════════════════════════════════════════════════════════════
router.delete('/:userId/avatar', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

const result = await db.query(
    `UPDATE users
        SET avatar_url = NULL, avatar_s3_key = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING ${USER_COLS}`,
    [userId]
);

res.json({ message: 'Avatar removed', user: result.rows[0] });
} catch (err) {
console.error('Avatar remove error:', err);
res.status(500).json({ error: { message: 'Failed to remove avatar' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// GET /users/profile  — own profile (auth required)
// ════════════════════════════════════════════════════════════════════════════
router.get('/profile', authMiddleware, async (req, res) => {
try {
const result = await db.query(
    `SELECT ${USER_COLS} FROM users WHERE id = $1`,
    [req.user.id]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

// Re-sign avatar URL on every fetch so it never expires in the UI
const user = result.rows[0];
if (user.avatar_s3_key) {
    user.avatar_url = getSignedUrl(user.avatar_s3_key);
}

res.json({ user });
} catch (err) {
console.error('Get profile error:', err);
res.status(500).json({ error: { message: 'Failed to fetch profile' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// PUT /users/:userId  — update profile fields
// ════════════════════════════════════════════════════════════════════════════
router.put('/:userId', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const {
    username, email, bio, skills,
    social_links, looking_for_collab,
    preferred_genres, equipment,
} = req.body;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

if (!username || !email) {
    return res.status(400).json({ error: { message: 'Username and email are required' } });
}

// Input validation
if (username.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({ error: { message: 'Username must be 30 chars max, letters/numbers/underscores/hyphens only' } });
}
if (bio && bio.length > 500) {
    return res.status(400).json({ error: { message: 'Bio must be 500 characters or less' } });
}

// Uniqueness checks
const [emailChk, userChk] = await Promise.all([
    db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]),
    db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]),
]);
if (emailChk.rows.length > 0) return res.status(400).json({ error: { message: 'Email already taken' } });
if (userChk.rows.length > 0)  return res.status(400).json({ error: { message: 'Username already taken' } });

const result = await db.query(
    `UPDATE users
        SET username = $1, email = $2, bio = $3, skills = $4,
            social_links = $5, looking_for_collab = $6,
            preferred_genres = $7, equipment = $8,
            updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING ${USER_COLS}`,
    [
    username, email, bio,
    skills || [],
    social_links || '{}',
    looking_for_collab !== false,
    preferred_genres || [],
    equipment || [],
    userId,
    ]
);

const user = result.rows[0];
if (user.avatar_s3_key) {
    user.avatar_url = getSignedUrl(user.avatar_s3_key);
}

res.json({ message: 'Profile updated successfully', user });
} catch (err) {
console.error('Update user profile error:', err);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// PUT /users/:userId/password
// ════════════════════════════════════════════════════════════════════════════
router.put('/:userId/password', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
const { current_password, new_password } = req.body;

if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
}

if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: { message: 'New password must be at least 8 characters' } });
}

const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
if (!rows.length) return res.status(404).json({ error: { message: 'User not found' } });

const valid = await bcrypt.compare(current_password, rows[0].password_hash);
if (!valid) return res.status(400).json({ error: { message: 'Current password is incorrect' } });

const hash = await bcrypt.hash(new_password, 12);
await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

res.json({ message: 'Password updated successfully' });
} catch (err) {
console.error('Change password error:', err);
res.status(500).json({ error: { message: 'Failed to change password' } });
}
});


// ════════════════════════════════════════════════════════════════════════════
// GET /users/by-username/:username  — public profile by username slug
// ════════════════════════════════════════════════════════════════════════════
router.get('/by-username/:username', async (req, res) => {
try {
const { username } = req.params;

const userResult = await db.query(
    `SELECT ${USER_COLS} FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

const user = userResult.rows[0];
if (user.avatar_s3_key) {
    user.avatar_url = getSignedUrl(user.avatar_s3_key);
}

let completedCollabs = 0;
try {
    const r = await db.query('SELECT COUNT(*) as count FROM submissions s WHERE s.collaborator_id = $1', [user.id]);
    completedCollabs = parseInt(r.rows[0].count);
} catch {}

res.json({ user: { ...user, completed_collaborations: completedCollabs } });
} catch (err) {
console.error('Get user by username error:', err);
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// GET /users/:id  — public profile
// ════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;
if (isNaN(parseInt(id))) {
    return res.status(400).json({ error: { message: 'Invalid user ID' } });
}

const userResult = await db.query(
    `SELECT ${USER_COLS} FROM users WHERE id = $1`,
    [id]
);

if (userResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'User not found' } });
}

const user = userResult.rows[0];

// Re-sign avatar
if (user.avatar_s3_key) {
    user.avatar_url = getSignedUrl(user.avatar_s3_key);
}

// Collab count
let completedCollabs = 0;
try {
    const r = await db.query('SELECT COUNT(*) as count FROM submissions s WHERE s.collaborator_id = $1', [id]);
    completedCollabs = parseInt(r.rows[0].count);
} catch {}

res.json({ user: { ...user, completed_collaborations: completedCollabs } });
} catch (err) {
console.error('Get user error:', err);
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

// ════════════════════════════════════════════════════════════════════════════
// Legacy: PUT /users/profile  (kept for backward compat)
// ════════════════════════════════════════════════════════════════════════════
router.put('/profile', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
const { username, email, bio, skills, social_links, looking_for_collab } = req.body;

if (!username || !email) {
    return res.status(400).json({ error: { message: 'Username and email are required' } });
}

const result = await db.query(
    `UPDATE users
        SET username=$1, email=$2, bio=$3, skills=$4,
            social_links=$5, looking_for_collab=$6, updated_at=CURRENT_TIMESTAMP
    WHERE id=$7
    RETURNING ${USER_COLS}`,
    [username, email, bio, skills || [], social_links || '{}', looking_for_collab !== false, userId]
);

res.json({ message: 'Profile updated', user: result.rows[0] });
} catch (err) {
console.error('Update profile error:', err);
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

module.exports = router;