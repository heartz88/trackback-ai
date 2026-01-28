const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Register
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: { message: 'User already exists' } });
        }

        // Hash password with 10 salt rounds (Industry standard)
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];

        // Generate token using secret from root .env
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: { message: 'Server error' } });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Fetch user from DB
        const result = await db.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }

        const user = result.rows[0];

        // DEBUG LOGS (Remove in production)
        console.log('--- LOGIN ATTEMPT ---');
        console.log('Target Email:', email);

        // Compare plain-text password with Bcrypt hash
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Bcrypt Match Result:', isValid);

        if (!isValid) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }

        // Generate JWT using the secret from your root .env
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET, // Ensure this is defined in your .env
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Server error' } });
    }
});

module.exports = router;