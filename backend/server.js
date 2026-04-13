require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Import database pool
const db = require('./config/database');
const { triggerNotificationEmail } = require('./config/emailTrigger');

// Validate required env vars at startup — fail loud rather than silently broken
['JWT_SECRET', 'DATABASE_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'].forEach(k => {
  if (!process.env[k]) {
    console.error(`FATAL: Missing required environment variable: ${k}`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o=>o.trim()):
[
  'https://trackback-frontend-3ofn.onrender.com',
  'http://localhost:3005',
  'http://localhost:3000',
  'http://trackbackai.me'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Global: 200 req/15min per IP (catches general abuse)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.' } }
});

// Auth endpoints: 10 attempts per 15min per IP (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many login attempts. Please try again in 15 minutes.' } },
  skipSuccessfulRequests: true  // Only count failed attempts
});

// Account creation: 5 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many accounts created from this IP. Please try again later.' } }
});

// Upload endpoints: 20 per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Upload limit reached. Please try again later.' } }
});

// Write endpoints: 30 per minute per IP (prevents vote/comment spam)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please slow down.' } }
});

app.use(globalLimiter);

// Configure Helmet
app.use(
helmet({
contentSecurityPolicy: {
    directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://trackback-frontend-3ofn.onrender.com", "https://trackback-backend-3ofn.onrender.com"],
    },
},
})
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
transports: ['websocket', 'polling'],
allowEIO3: true,
pingTimeout: 60000,
pingInterval: 25000,
cookie: false
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// Store online users in memory — shared module so routes can import without circular deps
const onlineUsers = require('./config/onlineUsers');

// Socket.IO authentication middleware
io.use(async (socket, next) => {
try {
const token = socket.handshake.auth.token;

if (!token) {
    return next(new Error('Authentication error: No token provided'));
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Check if user exists in database
const userResult = await db.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [decoded.id || decoded.userId]
);

if (userResult.rows.length === 0) {
    return next(new Error('Authentication error: User not found'));
}

const user = userResult.rows[0];
socket.userId = user.id;
socket.username = user.username;
socket.email = user.email;
next();
} catch (err) {
console.error('❌ Socket auth error:', err.message);
next(new Error('Authentication error: Invalid token'));
}
});

// Socket.IO connection handler
io.on('connection', (socket) => {

// Add user to online users
onlineUsers.set(socket.userId, {
socketId: socket.id,
userId: socket.userId,
username: socket.username,
email: socket.email,
connectedAt: new Date()
});

// Update online users in database
db.query(
`INSERT INTO online_users (user_id, socket_id, last_activity) 
    VALUES ($1, $2, NOW()) 
    ON CONFLICT (user_id) 
    DO UPDATE SET socket_id = $2, last_activity = NOW()`,
[socket.userId, socket.id]
).catch(err => console.error('Error updating online users:', err));

// Notify the user they're connected
socket.emit('connection:established', {
message: 'Connected to real-time server',
userId: socket.userId,
username: socket.username,
socketId: socket.id,
timestamp: new Date().toISOString()
});

// Send list of online users to the connected user (EXCLUDING CURRENT USER)
const onlineUsersList = Array.from(onlineUsers.entries())
.filter(([userId, _]) => userId !== socket.userId)
.map(([_, user]) => ({
    id: user.userId,
    username: user.username,
    email: user.email
}));

socket.emit('users:online', { 
onlineUsers: onlineUsersList,
timestamp: new Date().toISOString(),
total: onlineUsersList.length
});



// Notify all other users about this user coming online
socket.broadcast.emit('user:online', {
userId: socket.userId,
username: socket.username,
email: socket.email,
timestamp: new Date().toISOString()
});

// ============ MESSAGE HANDLING ============
socket.on('message:send', async (data) => {
try {
    const { conversationId, content } = data;
    
    if (!conversationId || !content || content.trim() === '' || content.length > 5000) {
    return socket.emit('error', { message: 'Invalid message data' });
    }


    const convResult = await db.query(
    `SELECT cp.conversation_id 
        FROM conversation_participants cp 
        WHERE cp.conversation_id = $1 AND cp.user_id = $2`,
    [conversationId, socket.userId]
    );

    if (convResult.rows.length === 0) {
    return socket.emit('error', { message: 'Not a participant in this conversation' });
    }

    // Save message to DB with read_by array so history persists on refresh
    const messageResult = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, content, created_at, read_by) 
        VALUES ($1, $2, $3, NOW(), ARRAY[]::INTEGER[]) 
        RETURNING id, conversation_id, sender_id, content, created_at`,
    [conversationId, socket.userId, content.trim()]
    );

    const message = messageResult.rows[0];

    // Update conversation timestamp so it floats to top of sidebar
    await db.query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
    );

    const messageData = {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    senderName: socket.username,
    content: message.content,
    timestamp: message.created_at,
    read: false
    };

    // ✅ KEY FIX: Broadcast to the room so BOTH users receive message:new.
    // Previously this only sent to individual socket IDs, so the sender
    // never got their own message back — the chat panel stayed blank.
    io.to(`conversation:${conversationId}`).emit('message:new', messageData);

    // For participants who are online but haven't joined the room yet
    // (e.g. browsing a different page), notify them directly too.
    const participantsResult = await db.query(
    `SELECT user_id FROM conversation_participants WHERE conversation_id = $1`,
    [conversationId]
    );

    participantsResult.rows.forEach(({ user_id: userId }) => {
    if (userId !== socket.userId) {
        if (onlineUsers.has(userId)) {
        const userSocketId = onlineUsers.get(userId).socketId;
        const targetSocket = io.sockets.sockets.get(userSocketId);
        const alreadyInRoom = targetSocket?.rooms?.has(`conversation:${conversationId}`);
        if (!alreadyInRoom) {
            io.to(userSocketId).emit('message:new', messageData);
        }

        db.query(
            `INSERT INTO notifications (user_id, type, content, related_id) 
            VALUES ($1, 'message', $2, $3)`,
            [userId, `New message from ${socket.username}`, message.id]
        ).catch(err => console.error('Error creating notification:', err));
        } else {
        // User is offline — save notification and send email
        db.query(
            `INSERT INTO notifications (user_id, type, content, related_id) 
            VALUES ($1, 'message', $2, $3)`,
            [userId, `New message from ${socket.username}`, message.id]
        ).catch(err => console.error('Error creating notification:', err));

        triggerNotificationEmail(db, userId, 'message', {
            senderName: socket.username,
            conversationId,
        });
        }
    }
    });

    socket.emit('message:sent', {
    messageId: message.id,
    conversationId: conversationId,
    timestamp: new Date().toISOString()
    });

} catch (err) {
    console.error('❌ Error handling message:', err);
    socket.emit('error', { 
    message: 'Failed to send message', 
    details: err.message 
    });
}
});

// ============ COLLABORATION HANDLING ============
socket.on('collaboration:request', async (data) => {
try {
    const { trackId, message } = data;
    
    if (!trackId || !message) {
    return socket.emit('error', { message: 'Missing required fields' });
    }

    

    const trackResult = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1',
    [trackId]
    );
    
    if (trackResult.rows.length === 0) {
    return socket.emit('error', { message: 'Track not found' });
    }
    
    const trackOwnerId = trackResult.rows[0].user_id;
    const trackTitle = trackResult.rows[0].title;

    if (trackOwnerId === socket.userId) {
    return socket.emit('error', { message: 'Cannot request collaboration on your own track' });
    }

    const existingRequest = await db.query(
    'SELECT id FROM collaboration_requests WHERE track_id = $1 AND collaborator_id = $2',
    [trackId, socket.userId]
    );

    if (existingRequest.rows.length > 0) {
    return socket.emit('error', { message: 'Collaboration request already sent' });
    }

    const collabResult = await db.query(
    `INSERT INTO collaboration_requests 
        (track_id, collaborator_id, message, status, created_at) 
        VALUES ($1, $2, $3, 'pending', NOW()) 
        RETURNING id, track_id, collaborator_id, message, status, created_at`,
    [trackId, socket.userId, message]
    );

    const request = collabResult.rows[0];

    const requestData = {
    requestId: request.id,
    trackId: request.track_id,
    trackTitle: trackTitle,
    requesterId: socket.userId,
    requesterName: socket.username,
    message: request.message,
    timestamp: request.created_at,
    status: request.status
    };

    if (onlineUsers.has(trackOwnerId)) {
    const ownerSocketId = onlineUsers.get(trackOwnerId).socketId;
    io.to(ownerSocketId).emit('collaboration:request', requestData);
    }

    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) 
        VALUES ($1, 'collaboration_request', $2, $3)`,
    [trackOwnerId, `${socket.username} wants to collaborate on "${trackTitle}"`, request.id]
    );

    socket.emit('collaboration:sent', {
    success: true,
    requestId: request.id,
    message: 'Collaboration request sent successfully',
    timestamp: new Date().toISOString()
    });

} catch (err) {
    console.error('❌ Error handling collaboration request:', err);
    socket.emit('error', { 
    message: 'Failed to send collaboration request', 
    details: err.message 
    });
}
});

socket.on('collaboration:respond', async (data) => {
try {
    const { requestId, status, message } = data;
    
    if (!requestId || !status) {
    return socket.emit('error', { message: 'Missing required fields' });
    }

    

    const requestResult = await db.query(
    `SELECT cr.*, t.title as track_title, cr.collaborator_id 
        FROM collaboration_requests cr
        JOIN tracks t ON cr.track_id = t.id
        WHERE cr.id = $1`,
    [requestId]
    );

    if (requestResult.rows.length === 0) {
    return socket.emit('error', { message: 'Collaboration request not found' });
    }

    const request = requestResult.rows[0];

    const trackOwnerResult = await db.query(
    'SELECT user_id FROM tracks WHERE id = $1',
    [request.track_id]
    );

    if (trackOwnerResult.rows[0].user_id !== socket.userId) {
    return socket.emit('error', { message: 'Not authorized to respond to this request' });
    }

    await db.query(
    'UPDATE collaboration_requests SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, requestId]
    );

    if (status === 'approved') {
    await db.query(
        'UPDATE tracks SET status = $1 WHERE id = $2',
        ['in_progress', request.track_id]
    );
    }

    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) 
        VALUES ($1, 'collaboration_response', $2, $3)`,
    [
        request.collaborator_id,
        `Your collaboration request for "${request.track_title}" was ${status}`,
        requestId
    ]
    );

    const responseData = {
    requestId: requestId,
    trackId: request.track_id,
    trackTitle: request.track_title,
    status: status,
    message: message || '',
    respondentId: socket.userId,
    respondentName: socket.username,
    timestamp: new Date().toISOString()
    };

    if (onlineUsers.has(request.collaborator_id)) {
    const requesterSocketId = onlineUsers.get(request.collaborator_id).socketId;
    io.to(requesterSocketId).emit('collaboration:response', responseData);
    }

    socket.emit('collaboration:responded', {
    success: true,
    requestId: requestId,
    message: `Request ${status} successfully`
    });

} catch (err) {
    console.error('❌ Error handling collaboration response:', err);
    socket.emit('error', { 
    message: 'Failed to respond to collaboration request', 
    details: err.message 
    });
}
});

socket.on('user:typing', (data) => {
try {
    const { conversationId, isTyping } = data;
    
    if (!conversationId) {
    return;
    }

    db.query(
    `SELECT user_id FROM conversation_participants 
        WHERE conversation_id = $1 AND user_id != $2`,
    [conversationId, socket.userId]
    ).then(participantsResult => {
    participantsResult.rows.forEach(row => {
        const participantId = row.user_id;
        if (onlineUsers.has(participantId)) {
        const participantSocketId = onlineUsers.get(participantId).socketId;
        io.to(participantSocketId).emit('user:typing', {
            conversationId,
            userId: socket.userId,
            username: socket.username,
            isTyping,
            timestamp: new Date().toISOString()
        });
        }
    });
    }).catch(err => console.error('Error handling typing indicator:', err));

} catch (err) {
    console.error('Error in typing handler:', err);
}
});

socket.on('join:conversation', (conversationId) => {
socket.join(`conversation:${conversationId}`);


db.query(
    `UPDATE conversation_participants 
    SET last_read_at = NOW() 
    WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, socket.userId]
).catch(err => console.error('Error updating last read:', err));
});

socket.on('leave:conversation', (conversationId) => {
socket.leave(`conversation:${conversationId}`);
});

socket.on('heartbeat', () => {
db.query(
    'UPDATE online_users SET last_activity = NOW() WHERE user_id = $1',
    [socket.userId]
).catch(err => console.error('Error updating heartbeat:', err));
});

socket.on('disconnect', () => {

onlineUsers.delete(socket.userId);

db.query(
    'DELETE FROM online_users WHERE user_id = $1',
    [socket.userId]
).catch(err => console.error('Error removing online user:', err));

socket.broadcast.emit('user:offline', {
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date().toISOString()
});


});
});

// ── Security Logger ──────────────────────────────────────────────────────────
function logSecurityEvent(type, req, details = {}) {
  console.log(JSON.stringify({
    type,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    ...details
  }));
}

// Attach logger to req so routes can use it
app.use((req, res, next) => {
  req.logSecurity = (type, details) => logSecurityEvent(type, req, details);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
res.json({
status: 'ok',
timestamp: new Date().toISOString(),
services: { database: 'connected', socketio: 'running' }
});
});

app.get('/api/health', (req, res) => {
res.json({
status: 'ok',
timestamp: new Date().toISOString(),
services: { database: 'connected', socketio: 'running' }
});
});

// /socket-status removed — was leaking all connected user data publicly

// Database connection verification
const verifyDbConnection = async () => {
try {
const result = await db.query('SELECT NOW()');
} catch (err) {
process.exit(1);
}
};

// Import routes
const onlineRoutes = require('./routes/online.js');
const authRoutes = require('./routes/auth.js');
const trackRoutes = require('./routes/tracks.js');
const collaborationRoutes = require('./routes/collaborations.js');
const submissionRoutes = require('./routes/submissions.js');
const userRoutes = require('./routes/users.js');
const notificationRoutes = require('./routes/notifications.js');
const messageRoutes = require('./routes/messages.js');
const votesRoutes = require('./routes/votes.js');
const commentsRoutes = require('./routes/comments.js');


// API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/tracks/upload', uploadLimiter);
app.use('/api/tracks', trackRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/online', onlineRoutes);
app.use('/api/votes', writeLimiter, votesRoutes);
app.use('/api/comments', writeLimiter, commentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
console.error('🔥 Error Caught by Middleware:', err.stack);
res.status(err.status || 500).json({
error: {
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
    stack: err.stack,
    details: err.details || 'No additional details provided'
    })
}
});
});

// 404 handler - MUST be last!
app.use((req, res) => {
res.status(404).json({
error: {
    message: `Route [${req.method}] ${req.url} not found` 
}
});
});

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
try {
// Verify database connection
await verifyDbConnection();

// Start the server
server.listen(PORT, async () => {
    // Clear online users table
    await db.query('DELETE FROM online_users').catch(() => {
    });
});
} catch (err) {
process.exit(1);
}
};

// Start the server
startServer();

module.exports = { app, server, io, onlineUsers };