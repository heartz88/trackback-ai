const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { Resend } = require('resend');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'TrackBackAI <notifications@trackbackai.me>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
    {
        id: user.id,
        userId: user.id,
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

        const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
        );

        if (existingUser.rows.length > 0) {
        return res.status(400).json({
            error: { message: 'User with this email or username already exists' }
        });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, bio, skills, 
                               social_links, looking_for_collab, last_active, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
             RETURNING id, username, email, bio, skills, social_links, looking_for_collab, created_at`,
            [username, email, hashedPassword, bio || '', skills || [], '{}', true]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
        message: 'User registered successfully',
        token,
        user
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
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
        return res.status(401).json({
            error: { message: 'Invalid email or password' }
        });
        }

        await db.query(
            'UPDATE users SET last_active = NOW() WHERE id = $1',
            [user.id]
        );

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
            social_links: user.social_links,
            looking_for_collab: user.looking_for_collab,
            createdAt: user.created_at
        }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Login failed' } });
    }
    }
);

// Refresh token
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
    const userId = req.user.id;

    const result = await db.query(
        'SELECT id, username, email, bio, skills, social_links, looking_for_collab, created_at FROM users WHERE id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
        error: { message: 'User not found' }
        });
    }

    const user = result.rows[0];

    await db.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
    );

    const newToken = generateToken(user);

    res.json({
        message: 'Token refreshed successfully',
        token: newToken,
        user
    });
    } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
        error: {
        message: 'Token refresh failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
    });
    }
});

// Forgot Password - Request reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Always return success for security (don't reveal if email exists)
        const successMsg = { message: 'If an account exists, you will receive reset instructions' };

        const userResult = await db.query(
            'SELECT id, username FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.json(successMsg);
        }

        const user = userResult.rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store token in database
        await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetToken, tokenExpiry, user.id]
        );

        const resetLink = FRONTEND_URL + '/reset-password?token=' + resetToken;

        // Send password reset email via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#040d14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Reset your TrackBackAI password — link expires in 1 hour</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#040d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f2027,#1a3a3a);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid rgba(20,184,166,0.2);">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#14b8a6,#06b6d4);border-radius:10px;display:inline-block;"></div>
            <span style="font-size:22px;font-weight:800;color:#f0fdfa;letter-spacing:-0.03em;">TrackBack<span style="color:#14b8a6;">AI</span></span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0a1628;padding:40px;border-left:1px solid rgba(20,184,166,0.1);border-right:1px solid rgba(20,184,166,0.1);">
          <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">Reset Your Password 🔐</h2>
          <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${user.username}</strong>,</p>
          <div style="background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.18);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="color:#e2e8f0;font-size:15px;margin:0;">
              We received a request to reset your password. Click the button below to set a new one.
            </p>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 24px;">This link expires in <strong style="color:#e2e8f0;">1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#14b8a6,#06b6d4);color:#0f172a;font-weight:800;font-size:15px;border-radius:100px;text-decoration:none;letter-spacing:0.02em;">Reset Password →</a>
          </div>
          <p style="color:#64748b;font-size:12px;margin:24px 0 0;word-break:break-all;">Or copy this link: <a href="${resetLink}" style="color:#14b8a6;">${resetLink}</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#040d14;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(20,184,166,0.08);border-top:none;">
          <p style="color:#475569;font-size:12px;margin:0 0 8px;">
            You're receiving this because a password reset was requested for your TrackBackAI account.
          </p>
          <a href="${FRONTEND_URL}" style="color:#475569;font-size:12px;text-decoration:none;">TrackBackAI</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: email,
                    subject: '🔐 Reset your TrackBackAI password',
                    html,
                });

                console.log('✉️  Password reset email sent to:', email);
            } catch (emailErr) {
                // Never block the response due to email failure
                console.error('❌ Failed to send reset email:', emailErr.message);
            }
        } else {
            console.log('⚠️  RESEND_API_KEY not set — reset link:', resetLink);
        }

        res.json(successMsg);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: { message: 'Failed to process request' } });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;

        const userResult = await db.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: { message: 'Invalid or expired reset token' } });
        }

        const user = userResult.rows[0];
        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: { message: 'Failed to reset password' } });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
    const userId = req.user.id;

    const result = await db.query(
        'SELECT id, username, email, bio, skills, social_links, looking_for_collab, created_at FROM users WHERE id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
        error: { message: 'User not found' }
        });
    }

    const user = result.rows[0];

    await db.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
    );

    res.json({ user });
    } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch user' } });
    }
});

module.exports = router;