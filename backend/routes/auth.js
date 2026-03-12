const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { Resend } = require('resend');
const { getSignedUrl } = require('../config/s3');

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
        email: user.email,
        email_verified: user.email_verified
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
    );
};

// Helper function to refresh avatar URL if needed
const refreshAvatarUrl = (user) => {
    if (user.avatar_s3_key) {
        user.avatar_url = getSignedUrl(user.avatar_s3_key);
    }
    return user;
};

// Helper function to send verification email
const sendVerificationEmail = async (email, username, token) => {
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;">Welcome to TrackBackAI — verify your email to get started</div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">
            <tr><td align="center">
                <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

                    <!-- Logo -->
                    <tr><td style="padding-bottom:24px;text-align:center;">
                        <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">
                            Track<span style="color:#14b8a6;">Back</span>AI
                        </span>
                    </td></tr>

                    <!-- Card -->
                    <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

                        <!-- Accent bar -->
                        <div style="height:4px;background:linear-gradient(90deg,#14b8a6,#06b6d4);"></div>

                        <!-- Body -->
                        <div style="padding:40px 48px;">
                            <p style="font-size:13px;font-weight:600;color:#14b8a6;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Welcome to TrackBackAI</p>
                            <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">Verify your email address</h1>
                            <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>

                            <div style="background:#f0fdfa;border-left:3px solid #14b8a6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
                                <p style="color:#0f172a;font-size:14px;margin:0;line-height:1.6;">
                                    Thanks for joining TrackBackAI! Please verify your email address by clicking the button below. This link expires in <strong>24 hours</strong>.
                                </p>
                            </div>

                            <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">If you didn't create this account, you can safely ignore this email.</p>

                            <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
                                <tr><td style="background:linear-gradient(135deg,#14b8a6,#06b6d4);border-radius:100px;">
                                    <a href="${verificationLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.02em;text-decoration:none;">Verify Email →</a>
                                </td></tr>
                            </table>

                            <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;word-break:break-all;text-align:center;">
                                Or copy this link:<br/>
                                <a href="${verificationLink}" style="color:#14b8a6;">${verificationLink}</a>
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;line-height:1.6;">
                                This email was sent because you registered for TrackBackAI.
                            </p>
                            <a href="${FRONTEND_URL}" style="color:#94a3b8;font-size:12px;text-decoration:none;">trackbackai.me</a>
                        </div>

                    </td></tr>

                    <!-- Bottom note -->
                    <tr><td style="padding-top:20px;text-align:center;">
                        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2025 TrackBackAI. All rights reserved.</p>
                    </td></tr>

                </table>
            </td></tr>
        </table>
    </body>
    </html>
    `;

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Verify your TrackBackAI email address',
        html,
    });
};

// Register with email verification
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

        // Check if user exists
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
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user with email_verified = false
        const result = await db.query(
            `INSERT INTO users (
                username, email, password_hash, bio, skills, 
                social_links, looking_for_collab, last_active, created_at,
                email_verified, verification_token, verification_token_expiry
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10)
            RETURNING id, username, email, bio, skills, social_links, looking_for_collab, 
                      avatar_url, avatar_s3_key, created_at, email_verified`,
            [username, email, hashedPassword, bio || '', skills || [], '{}', true, 
             false, verificationToken, tokenExpiry]
        );

        const user = result.rows[0];

        // Send verification email
        try {
            await sendVerificationEmail(email, username, verificationToken);
            console.log(`✉️ Verification email sent to: ${email}`);
        } catch (emailErr) {
            console.error('Failed to send verification email:', emailErr.message);
            // Don't block registration if email fails
        }

        // Generate auth token (user can't do much until verified)
        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            token,
            user: {
                ...user,
                email_verified: false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: { message: 'Registration failed' } });
    }
    }
);

// Login with email verification check
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

        const { email, password, rememberMe } = req.body;

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

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                error: { 
                    message: 'Please verify your email before logging in',
                    code: 'EMAIL_NOT_VERIFIED',
                    email: user.email
                }
            });
        }

        await db.query(
            'UPDATE users SET last_active = NOW() WHERE id = $1',
            [user.id]
        );

        // Refresh avatar URL if exists
        refreshAvatarUrl(user);

        // Set token expiry based on remember me
        const tokenExpiry = rememberMe ? '30d' : '24h';
        
        const token = jwt.sign(
            { 
                id: user.id, 
                userId: user.id, 
                username: user.username, 
                email: user.email,
                email_verified: user.email_verified
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

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
                avatar_url: user.avatar_url,
                avatar_s3_key: user.avatar_s3_key,
                created_at: user.created_at,
                email_verified: user.email_verified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Login failed' } });
    }
    }
);

// Verify email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ 
                error: { message: 'Verification token is required' } 
            });
        }

        // Find user with this token and check expiry
        const result = await db.query(
            `SELECT id, username, email, verification_token_expiry 
             FROM users 
             WHERE verification_token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ 
                error: { message: 'Invalid verification token' } 
            });
        }

        const user = result.rows[0];

        // Check if token expired
        if (new Date() > new Date(user.verification_token_expiry)) {
            return res.status(400).json({ 
                error: { message: 'Verification token has expired. Please request a new one.' } 
            });
        }

        // Update user as verified
        await db.query(
            `UPDATE users 
             SET email_verified = true, 
                 verification_token = NULL, 
                 verification_token_expiry = NULL 
             WHERE id = $1`,
            [user.id]
        );

        res.json({ 
            message: 'Email verified successfully! You can now log in.',
            verified: true 
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ 
            error: { message: 'Failed to verify email' } 
        });
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                error: { message: 'Email is required' } 
            });
        }

        // Find user
        const userResult = await db.query(
            'SELECT id, username, email, email_verified FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal that email doesn't exist (security)
            return res.json({ 
                message: 'If an account exists, a verification email has been sent.' 
            });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ 
                error: { message: 'Email already verified' } 
            });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.query(
            `UPDATE users 
             SET verification_token = $1, verification_token_expiry = $2 
             WHERE id = $3`,
            [verificationToken, tokenExpiry, user.id]
        );

        // Send email
        await sendVerificationEmail(user.email, user.username, verificationToken);

        res.json({ 
            message: 'If an account exists, a verification email has been sent.' 
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ 
            error: { message: 'Failed to resend verification email' } 
        });
    }
});

// Refresh token
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            'SELECT id, username, email, bio, skills, social_links, looking_for_collab, avatar_url, avatar_s3_key, created_at, email_verified FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];
        
        // Refresh avatar URL if exists
        refreshAvatarUrl(user);

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
                message: 'Token refresh failed'
            }
        });
    }
});

// Forgot Password - Request reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

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

        await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetToken, tokenExpiry, user.id]
        );

        const resetLink = FRONTEND_URL + '/reset-password?token=' + resetToken;

        if (process.env.RESEND_API_KEY) {
            try {
                const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Reset your TrackBackAI password — link expires in 1 hour</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">
            Track<span style="color:#14b8a6;">Back</span>AI
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Accent bar -->
          <div style="height:4px;background:linear-gradient(90deg,#14b8a6,#06b6d4);"></div>

          <!-- Body -->
          <div style="padding:40px 48px;">
            <p style="font-size:13px;font-weight:600;color:#14b8a6;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Password Reset</p>
            <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">Reset your password</h1>
            <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${user.username}</strong>,</p>

            <div style="background:#f0fdfa;border-left:3px solid #14b8a6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
              <p style="color:#0f172a;font-size:14px;margin:0;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
              </p>
            </div>

            <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>

            <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
              <tr><td style="background:linear-gradient(135deg,#14b8a6,#06b6d4);border-radius:100px;">
                <a href="${resetLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.02em;text-decoration:none;">Reset Password →</a>
              </td></tr>
            </table>

            <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;word-break:break-all;text-align:center;">
              Or copy this link:<br/>
              <a href="${resetLink}" style="color:#14b8a6;">${resetLink}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;line-height:1.6;">
              You're receiving this because a password reset was requested for your TrackBackAI account.
            </p>
            <a href="${FRONTEND_URL}" style="color:#94a3b8;font-size:12px;text-decoration:none;">trackbackai.me</a>
          </div>

        </td></tr>

        <!-- Bottom note -->
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">© 2025 TrackBackAI. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: email,
                    subject: 'Reset your TrackBackAI password',
                    html,
                });
            } catch (emailErr) {
                console.error('Failed to send reset email:', emailErr.message);
            }
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
            'SELECT id, username, email, bio, skills, social_links, looking_for_collab, avatar_url, avatar_s3_key, created_at, email_verified FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];
        
        // Refresh avatar URL if exists
        refreshAvatarUrl(user);

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