const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { uploadToS3, getSignedUrl } = require('../config/s3');

const router = express.Router();

const avatarUpload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 5 * 1024 * 1024 },
fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, WebP or GIF allowed'), ok);
}
});

const USER_COLS = `id, username, email, bio, skills, social_links, looking_for_collab,
last_active, created_at, avatar_url, avatar_s3_key, preferred_genres, equipment`;

const resignAvatar = user => {
if (user?.avatar_s3_key) user.avatar_url = getSignedUrl(user.avatar_s3_key);
return user;
};

// POST /:userId/avatar — Upload profile picture
router.post('/:userId/avatar', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
try {
if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ error: { message: 'Unauthorized' } });
if (!req.file) return res.status(400).json({ error: { message: 'No image file provided' } });

const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
const s3Key = `avatars/${req.params.userId}/profile.${ext}`;
await uploadToS3(req.file, s3Key);
const avatarUrl = getSignedUrl(s3Key);

const result = await db.query(
    `UPDATE users SET avatar_url = $1, avatar_s3_key = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING ${USER_COLS}`,
    [avatarUrl, s3Key, req.params.userId]
);
res.json({ message: 'Avatar updated', user: result.rows[0], avatar_url: avatarUrl });
} catch (err) {
res.status(500).json({ error: { message: err.message || 'Failed to upload avatar' } });
}
});

// DELETE /:userId/avatar — Remove profile picture
router.delete('/:userId/avatar', authMiddleware, async (req, res) => {
try {
if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ error: { message: 'Unauthorized' } });
const result = await db.query(
    `UPDATE users SET avatar_url = NULL, avatar_s3_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING ${USER_COLS}`,
    [req.params.userId]
);
res.json({ message: 'Avatar removed', user: result.rows[0] });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to remove avatar' } });
}
});

// GET /profile — Own profile
router.get('/profile', authMiddleware, async (req, res) => {
try {
const result = await db.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [req.user.id]);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'User not found' } });
res.json({ user: resignAvatar(result.rows[0]) });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to fetch profile' } });
}
});

// GET /by-username/:username — Public profile by username
router.get('/by-username/:username', async (req, res) => {
try {
const result = await db.query(`SELECT ${USER_COLS} FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'User not found' } });
const user = resignAvatar(result.rows[0]);
const r = await db.query('SELECT COUNT(*) as count FROM submissions WHERE collaborator_id = $1', [user.id]).catch(() => ({ rows: [{ count: 0 }] }));
res.json({ user: { ...user, completed_collaborations: parseInt(r.rows[0].count) } });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

// GET /:id — Public profile by ID
router.get('/:id', async (req, res) => {
try {
if (isNaN(parseInt(req.params.id))) return res.status(400).json({ error: { message: 'Invalid user ID' } });
const result = await db.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [req.params.id]);
if (result.rows.length === 0) return res.status(404).json({ error: { message: 'User not found' } });
const user = resignAvatar(result.rows[0]);
const r = await db.query('SELECT COUNT(*) as count FROM submissions WHERE collaborator_id = $1', [req.params.id]).catch(() => ({ rows: [{ count: 0 }] }));
res.json({ user: { ...user, completed_collaborations: parseInt(r.rows[0].count) } });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to fetch user' } });
}
});

// PUT /:userId — Update profile
router.put('/:userId', authMiddleware, async (req, res) => {
try {
const { userId } = req.params;
if (req.user.id !== parseInt(userId)) return res.status(403).json({ error: { message: 'Unauthorized' } });

const { username, email, bio, skills, social_links, looking_for_collab, preferred_genres, equipment } = req.body;
if (!username || !email) return res.status(400).json({ error: { message: 'Username and email are required' } });
if (username.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(username))
    return res.status(400).json({ error: { message: 'Username must be 30 chars max, letters/numbers/underscores/hyphens only' } });
if (bio && bio.length > 500) return res.status(400).json({ error: { message: 'Bio must be 500 characters or less' } });

const [emailChk, userChk] = await Promise.all([
    db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]),
    db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]),
]);
if (emailChk.rows.length > 0) return res.status(400).json({ error: { message: 'Email already taken' } });
if (userChk.rows.length > 0) return res.status(400).json({ error: { message: 'Username already taken' } });

const result = await db.query(
    `UPDATE users SET username=$1, email=$2, bio=$3, skills=$4, social_links=$5,
        looking_for_collab=$6, preferred_genres=$7, equipment=$8, updated_at=CURRENT_TIMESTAMP
    WHERE id=$9 RETURNING ${USER_COLS}`,
    [username, email, bio, skills||[], social_links||'{}', looking_for_collab!==false, preferred_genres||[], equipment||[], userId]
);
res.json({ message: 'Profile updated successfully', user: resignAvatar(result.rows[0]) });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to update profile' } });
}
});

// PUT /:userId/password — Change password
router.put('/:userId/password', authMiddleware, async (req, res) => {
try {
if (req.user.id !== parseInt(req.params.userId)) return res.status(403).json({ error: { message: 'Unauthorized' } });
const { current_password, new_password } = req.body;
if (!new_password || new_password.length < 8) return res.status(400).json({ error: { message: 'New password must be at least 8 characters' } });

const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.params.userId]);
if (!rows.length) return res.status(404).json({ error: { message: 'User not found' } });
if (!await bcrypt.compare(current_password, rows[0].password_hash))
    return res.status(400).json({ error: { message: 'Current password is incorrect' } });

await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(new_password, 12), req.params.userId]);
res.json({ message: 'Password updated successfully' });
} catch (err) {
res.status(500).json({ error: { message: 'Failed to change password' } });
}
});

module.exports = router;