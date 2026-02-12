const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();


const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
    {
        id: user.id,
        userId: user.id, // Add both for compatibility
        username: user.username,
        email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
    );
};

// Register
router.post('/register',
    [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, bio, skills } = req.body;

        // Check if user already exists
        const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
        );

        if (existingUser.rows.length > 0) {
        return res.status(400).json({
            error: { message: 'User with this email or username already exists' }
        });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.query(
        `INSERT INTO users (username, email, password_hash, bio, skills, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING id, username, email, bio, skills, created_at`,
        [username, email, hashedPassword, bio || '', skills || []]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken(user);

        res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            skills: user.skills,
            createdAt: user.created_at
        }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: { message: 'Registration failed' } });
    }
    }
);

// Login
router.post('/login',
    [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
        );

        if (result.rows.length === 0) {
        return res.status(401).json({
            error: { message: 'Invalid email or password' }
        });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
        return res.status(401).json({
            error: { message: 'Invalid email or password' }
        });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            skills: user.skills,
            createdAt: user.created_at
        }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Login failed' } });
    }
    }
);

// ✅ NEW: Token refresh endpoint
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
    const userId = req.user.id;

    console.log(`🔄 Refreshing token for user: ${userId}`);

    // Fetch fresh user data from database
    const result = await db.query(
        'SELECT id, username, email, bio, skills, created_at FROM users WHERE id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
        error: { message: 'User not found' }
        });
    }

    const user = result.rows[0];

    // Generate new JWT token
    const newToken = generateToken(user);

    console.log(`✅ Token refreshed for user: ${user.username}`);

    res.json({
        message: 'Token refreshed successfully',
        token: newToken,
        user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        createdAt: user.created_at
        }
    });
    } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
        error: {
        message: 'Token refresh failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
    });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
    const userId = req.user.id;

    const result = await db.query(
        'SELECT id, username, email, bio, skills, created_at FROM users WHERE id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
        error: { message: 'User not found' }
        });
    }

    const user = result.rows[0];

    res.json({
        user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        createdAt: user.created_at
        }
    });
    } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch user' } });
    }
});

module.exports = router;