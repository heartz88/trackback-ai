const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { uploadToS3, getSignedUrl, deleteFromS3 } = require('../config/s3');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
storage,
limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
fileFilter: (req, file, cb) => {
const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/x-wav',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac'
];
if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
} else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
}
}
});

// Error handling wrapper for multer
const handleMulterError = (err, req, res, next) => {
if (err instanceof multer.MulterError) {
if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { message: 'File size too large. Maximum 50MB allowed.' } });
}
return res.status(400).json({ error: { message: err.message } });
} else if (err) {
return res.status(400).json({ error: { message: err.message } });
}
next();
};

// ─────────────────────────────────────────────────────────────────
// POST /upload — Upload a new track
// ─────────────────────────────────────────────────────────────────
router.post('/upload',
authMiddleware,
upload.single('audio'),
handleMulterError,
[
body('title').trim().notEmpty().withMessage('Title is required'),
body('description').optional().trim(),
body('genre').optional().trim(),
body('desired_skills').optional()
],
async (req, res) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
    return res.status(400).json({ error: { message: 'No audio file provided' } });
    }

    const { title, description, genre, desired_skills } = req.body;
    const userId = req.user.id;

    const timestamp = Date.now();
    const originalName = req.file.originalname;
    const fileExt = originalName.split('.').pop().toLowerCase();
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `tracks/${userId}/${timestamp}_${safeFileName}`;

    const s3Result = await uploadToS3(req.file, s3Key);
    
    let skillsArray = [];
    if (desired_skills) {
    if (typeof desired_skills === 'string') {
        skillsArray = desired_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    } else if (Array.isArray(desired_skills)) {
        skillsArray = desired_skills;
    }
    }

    const result = await db.query(
    `INSERT INTO tracks (
        user_id, title, description, s3_key, file_format, file_size,
        genre, desired_skills, analysis_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING *`,
    [userId, title, description || null, s3Key, fileExt, req.file.size,
        genre || null, skillsArray.length > 0 ? skillsArray : null]
    );

    const track = result.rows[0];

    const audioUrl = getSignedUrl(s3Key);

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';

    axios.post(`${mlServiceUrl}/analyze`, {
    track_id: track.id,
    s3_key: s3Key,
    s3_bucket: process.env.S3_BUCKET
    }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000
    })
    .then(() => {})
    .catch((mlError) => {
    console.error(`ML service request error for track ${track.id}:`, mlError.message);
    if (mlError.code !== 'ECONNABORTED' && mlError.message !== 'timeout of 120000ms exceeded') {
        db.query('UPDATE tracks SET analysis_status = $1 WHERE id = $2', ['failed', track.id])
        .catch(err => console.error('Error updating track status:', err));
    }
    });

    // Emit real-time event so Discover page updates live
    try {
    const { io } = require('../server');
    io.emit('track:new', {
        trackId: track.id,
        title: track.title,
        username: req.user.username,
        genre: track.genre || null,
        timestamp: new Date().toISOString()
    });
    } catch (e) { /* non-critical */ }

    res.status(201).json({
    message: 'Track uploaded successfully. Analysis in progress.',
    track: {
        id: track.id,
        title: track.title,
        description: track.description,
        genre: track.genre,
        created_at: track.created_at,
        audio_url: audioUrl,
        analysis_status: track.analysis_status
    }
    });
} catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    if (error.code === '23505') {
    return res.status(400).json({ error: { message: 'A track with this title already exists' } });
    }
    res.status(500).json({
    error: {
        message: 'Failed to upload track',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
    });
}
}
);

// ─────────────────────────────────────────────────────────────────
// GET / — All tracks with filters
// ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
try {
const {
    bpm_min, bpm_max, energy_level, genre,
    status = 'open', limit = 20, offset = 0, user_id
} = req.query;

let query = `
    SELECT t.*, 
            u.username, 
            u.id as owner_id,
            u.avatar_url,
            u.avatar_s3_key
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
`;

const params = [];
let paramCount = 0;

if (status) {
    paramCount++;
    query += ` AND t.status = $${paramCount}`;
    params.push(status);
}

if (user_id) {
    paramCount++;
    query += ` AND t.user_id = $${paramCount}`;
    params.push(parseInt(user_id));
}

paramCount++;
query += ` AND t.analysis_status = $${paramCount}`;
params.push('completed');

if (bpm_min) {
    paramCount++;
    query += ` AND t.bpm >= $${paramCount}`;
    params.push(parseFloat(bpm_min));
}

if (bpm_max) {
    paramCount++;
    query += ` AND t.bpm <= $${paramCount}`;
    params.push(parseFloat(bpm_max));
}

if (energy_level) {
    paramCount++;
    query += ` AND LOWER(t.energy_level) = LOWER($${paramCount})`;
    params.push(energy_level.toLowerCase());
}

if (genre) {
    paramCount++;
    query += ` AND LOWER(t.genre) = LOWER($${paramCount})`;
    params.push(genre.toLowerCase());
}

query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
params.push(parseInt(limit), parseInt(offset));

const result = await db.query(query, params);

const tracks = result.rows.map(track => {
    if (track.avatar_s3_key) {
    track.avatar_url = getSignedUrl(track.avatar_s3_key);
    }
    return {
    ...track,
    audio_url: getSignedUrl(track.s3_key),
    duration: track.duration ? Math.round(track.duration) : null,
    bpm: track.bpm ? Math.round(track.bpm) : null,
    desired_skills: track.desired_skills || [],
    musical_key: track.musical_key || null
    };
});

let countQuery = `
    SELECT COUNT(*) as total
    FROM tracks t
    WHERE t.analysis_status = 'completed' AND t.status = $1
`;
const countParams = [status];

if (user_id) {
    countQuery += ' AND t.user_id = $2';
    countParams.push(parseInt(user_id));
}

const countResult = await db.query(countQuery, countParams);
const total = parseInt(countResult.rows[0].total);

res.json({
    tracks,
    count: tracks.length,
    total,
    hasMore: (parseInt(offset) + tracks.length) < total
});
} catch (error) {
console.error('Get tracks error:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch tracks',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// GET /completed — Completed tracks for CommunityPage
// MUST be before /:id so Express doesn't treat 'completed' as an ID
// ─────────────────────────────────────────────────────────────────
router.get('/completed', async (req, res) => {
try {
const { sort = 'featured', limit = 20 } = req.query;

const orderMap = {
    featured: 'winner_votes DESC, t.updated_at DESC',
    recent: 't.updated_at DESC',
    votes: 'winner_votes DESC',
};
const orderBy = orderMap[sort] || orderMap.featured;

const result = await db.query(
    `SELECT
    t.*,
    u.username AS owner_username,
    u.avatar_url AS owner_avatar_url,
    u.avatar_s3_key AS owner_avatar_s3_key,
    COUNT(DISTINCT cr.collaborator_id)::int AS collaborator_count,
    COALESCE(
        (SELECT COUNT(*)::int
        FROM votes v2
        WHERE v2.submission_id = t.completed_submission_id
            AND v2.vote_type = 'upvote'),
        0
    ) AS winner_votes
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN collaboration_requests cr
            ON cr.track_id = t.id AND cr.status = 'approved'
    WHERE t.status = 'completed'
    GROUP BY t.id, u.username, u.avatar_url, u.avatar_s3_key
    ORDER BY ${orderBy}
    LIMIT $1`,
    [parseInt(limit)]
);

const tracks = result.rows.map(t => {
    if (t.owner_avatar_s3_key) {
    t.owner_avatar_url = getSignedUrl(t.owner_avatar_s3_key);
    }
    return {
    ...t,
    audio_url: t.s3_key ? getSignedUrl(t.s3_key) : null,
    };
});

res.json({ tracks });
} catch (error) {
console.error('Completed tracks error:', error);
res.status(500).json({ error: { message: 'Failed to fetch completed tracks' } });
}
});

// ─────────────────────────────────────────────────────────────────
// GET /stats/community — Platform-wide stats for CommunityPage header
// MUST be before /:id so Express doesn't treat 'stats' as an ID
// ─────────────────────────────────────────────────────────────────
router.get('/stats/community', async (req, res) => {
try {
const result = await db.query(
    `SELECT
    (SELECT COUNT(*)::int FROM tracks WHERE status = 'completed') AS completed,
    (SELECT COUNT(DISTINCT collaborator_id)::int
        FROM collaboration_requests WHERE status = 'approved') AS collaborators,
    (SELECT COUNT(*)::int FROM votes WHERE vote_type = 'upvote') AS votes`
);
res.json({ stats: result.rows[0] });
} catch (error) {
console.error('Community stats error:', error);
res.status(500).json({ error: { message: 'Failed to fetch stats' } });
}
});

// ─────────────────────────────────────────────────────────────────
// GET /recommendations — Personalised track suggestions
// MUST be before /:id
// ─────────────────────────────────────────────────────────────────
router.get('/recommendations', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
const { limit = 10 } = req.query;

const result = await db.query(
    `SELECT
    t.id, t.title, t.description, t.bpm, t.energy_level, t.genre,
    t.musical_key, u.username as owner_username,
    u.avatar_url, u.avatar_s3_key,
    CASE
        WHEN t.genre = ANY(SELECT genre FROM tracks WHERE user_id = $1 AND genre IS NOT NULL) THEN 0.3
        ELSE 0.1
    END +
    CASE
        WHEN ABS(t.bpm - COALESCE(
        (SELECT AVG(bpm) FROM tracks WHERE user_id = $1 AND bpm IS NOT NULL), 120
        )) < 20 THEN 0.3
        ELSE 0.1
    END +
    CASE
        WHEN t.energy_level = COALESCE(
        (SELECT energy_level FROM tracks WHERE user_id = $1 AND energy_level IS NOT NULL ORDER BY created_at DESC LIMIT 1),
        'medium'
        ) THEN 0.4
        ELSE 0.2
    END as match_score
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'open'
        AND t.analysis_status = 'completed'
        AND t.user_id != $1
    ORDER BY match_score DESC
    LIMIT $2`,
    [userId, parseInt(limit)]
);

const recommendations = result.rows.map(track => {
    if (track.avatar_s3_key) {
    track.avatar_url = getSignedUrl(track.avatar_s3_key);
    }
    return {
    ...track,
    audio_url: getSignedUrl(track.s3_key),
    match_score: parseFloat(track.match_score).toFixed(2)
    };
});

res.json({ recommendations });
} catch (error) {
console.error('Get recommendations error:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch recommendations',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// GET /user/my-tracks — Authenticated user's own tracks
// MUST be before /:id
// ─────────────────────────────────────────────────────────────────
router.get('/user/my-tracks', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const result = await db.query(
    `SELECT t.*,
    (SELECT COUNT(*) FROM collaboration_requests cr WHERE cr.track_id = t.id) as collaboration_requests_count
    FROM tracks t
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [userId]
);

const tracks = result.rows.map(track => ({
    ...track,
    audio_url: getSignedUrl(track.s3_key),
    duration: track.duration ? Math.round(track.duration) : null,
    bpm: track.bpm ? Math.round(track.bpm) : null,
    desired_skills: track.desired_skills || [],
    musical_key: track.musical_key || null,
    collaboration_requests_count: parseInt(track.collaboration_requests_count) || 0
}));

res.json({ tracks });
} catch (error) {
console.error('Get user tracks error:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch tracks',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// GET /user/:userId — Public tracks for any user's profile
// MUST be before /:id
// ─────────────────────────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
try {
const { userId } = req.params;

if (isNaN(parseInt(userId))) {
    return res.status(400).json({ error: { message: 'Invalid user ID' } });
}

const result = await db.query(
    `SELECT t.*, u.username, u.avatar_url, u.avatar_s3_key
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    WHERE t.user_id = $1
        AND t.analysis_status = 'completed'
    ORDER BY t.created_at DESC`,
    [parseInt(userId)]
);

const tracks = result.rows.map(track => {
    if (track.avatar_s3_key) {
    track.avatar_url = getSignedUrl(track.avatar_s3_key);
    }
    return {
    ...track,
    audio_url: getSignedUrl(track.s3_key),
    duration: track.duration ? Math.round(track.duration) : null,
    bpm: track.bpm ? Math.round(track.bpm) : null,
    desired_skills: track.desired_skills || [],
    musical_key: track.musical_key || null
    };
});

res.json({ tracks });
} catch (error) {
console.error('Get user tracks by ID error:', error);
res.status(500).json({ error: { message: 'Failed to fetch tracks' } });
}
});

// ─────────────────────────────────────────────────────────────────
// GET /:id — Single track  <- all literal-path routes must be above this
// ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

const result = await db.query(
    `SELECT t.*, 
            u.username, 
            u.id as owner_id, 
            u.email as owner_email,
            u.avatar_url,
            u.avatar_s3_key
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = $1`,
    [id]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found' } });
}

const track = result.rows[0];

// Refresh owner avatar URL if exists
if (track.avatar_s3_key) {
    track.avatar_url = getSignedUrl(track.avatar_s3_key);
}

track.audio_url = getSignedUrl(track.s3_key);
track.duration = track.duration ? Math.round(track.duration) : null;
track.bpm = track.bpm ? Math.round(track.bpm) : null;
track.desired_skills = track.desired_skills || [];
track.musical_key = track.musical_key || null;

res.json({ track });
} catch (error) {
console.error('Get track error:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch track',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// PUT /:id/analysis — ML service callback
// ─────────────────────────────────────────────────────────────────
router.put('/:id/analysis', async (req, res) => {
try {
const { id } = req.params;
const { bpm, energy_level, duration, key, musical_key } = req.body;

if (!bpm || !energy_level || !duration) {
    return res.status(400).json({ error: { message: 'Missing required analysis fields' } });
}

const musicKey = key || musical_key;

const result = await db.query(
    `UPDATE tracks
    SET bpm = $1, energy_level = $2, duration = $3, musical_key = $4,
        analysis_status = 'completed', updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *`,
    [bpm, energy_level, duration, musicKey || null, id]
);

if (result.rows.length === 0) {
    console.error(`Track ${id} not found`);
    return res.status(404).json({ error: { message: 'Track not found' } });
}

res.json({ message: 'Analysis results updated successfully', track: result.rows[0] });
} catch (error) {
console.error('Update analysis error:', error);
res.status(500).json({
    error: {
    message: 'Failed to update analysis',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    hint: 'Make sure musical_key column exists in tracks table'
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// PUT /:id/metadata — Owner correction of MIR-detected values
// ─────────────────────────────────────────────────────────────────
router.put('/:id/metadata', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const userId = req.user.id;
const { bpm, musical_key, energy_level, genre } = req.body;

const ownerCheck = await db.query('SELECT user_id FROM tracks WHERE id = $1', [id]);
if (ownerCheck.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found' } });
}
if (ownerCheck.rows[0].user_id !== userId) {
    return res.status(403).json({ error: { message: 'Not authorized to update this track' } });
}

if (bpm !== undefined && bpm !== null) {
    const bpmNum = parseFloat(bpm);
    if (isNaN(bpmNum) || bpmNum < 20 || bpmNum > 400) {
    return res.status(400).json({ error: { message: 'BPM must be between 20 and 400' } });
    }
}

if (energy_level !== undefined && energy_level !== null) {
    if (!['low', 'medium', 'high'].includes(energy_level)) {
    return res.status(400).json({ error: { message: 'Energy level must be low, medium, or high' } });
    }
}

const result = await db.query(
    `UPDATE tracks
    SET bpm          = COALESCE($1, bpm),
        musical_key  = COALESCE($2, musical_key),
        energy_level = COALESCE($3, energy_level),
        genre        = COALESCE($4, genre),
        updated_at   = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *`,
    [bpm ? parseFloat(bpm) : null, musical_key || null, energy_level || null, genre || null, id]
);

const track = result.rows[0];
track.audio_url = getSignedUrl(track.s3_key);

res.json({ message: 'Track metadata updated successfully', track });
} catch (error) {
console.error('Update track metadata error:', error);
res.status(500).json({ error: { message: 'Failed to update track metadata' } });
}
});

// ─────────────────────────────────────────────────────────────────
// PUT /:id — General track update
// ─────────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const userId = req.user.id;
const { title, description, genre, desired_skills, status } = req.body;

const ownershipResult = await db.query('SELECT user_id FROM tracks WHERE id = $1', [id]);
if (ownershipResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found' } });
}
if (ownershipResult.rows[0].user_id !== userId) {
    return res.status(403).json({ error: { message: 'Not authorized to update this track' } });
}

let skillsArray = null;
if (desired_skills !== undefined) {
    if (typeof desired_skills === 'string') {
    skillsArray = desired_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    } else if (Array.isArray(desired_skills)) {
    skillsArray = desired_skills;
    }
}

const result = await db.query(
    `UPDATE tracks
    SET title          = COALESCE($1, title),
        description    = COALESCE($2, description),
        genre          = COALESCE($3, genre),
        desired_skills = COALESCE($4, desired_skills),
        status         = COALESCE($5, status),
        updated_at     = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *`,
    [title || null, description || null, genre || null, skillsArray, status || null, id]
);

const track = result.rows[0];
track.audio_url = getSignedUrl(track.s3_key);
track.musical_key = track.musical_key || null;

res.json({ message: 'Track updated successfully', track });
} catch (error) {
console.error('Update track error:', error);
res.status(500).json({
    error: {
    message: 'Failed to update track',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// ─────────────────────────────────────────────────────────────────
// DELETE /:id — Delete track and its S3 file
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
try {
const { id } = req.params;
const userId = req.user.id;

const result = await db.query(
    'SELECT s3_key FROM tracks WHERE id = $1 AND user_id = $2',
    [id, userId]
);

if (result.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Track not found or unauthorized' } });
}

const { s3_key } = result.rows[0];
await deleteFromS3(s3_key);
await db.query('DELETE FROM tracks WHERE id = $1', [id]);

res.json({ message: 'Track deleted successfully' });
} catch (error) {
console.error('Delete track error:', error);
res.status(500).json({
    error: {
    message: 'Failed to delete track',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

module.exports = router;