require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Import routes
const onlineRoutes = require('./routes/online');
const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const collaborationRoutes = require('./routes/collaborations');
const submissionRoutes = require('./routes/submissions');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');

// Import database pool
const db = require('./config/database');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
origin: process.env.FRONTEND_URL || 'http://localhost:3001',
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Socket.IO setup
const io = socketIo(server, {
cors: {
origin: process.env.FRONTEND_URL || 'http://localhost:3005',
credentials: true,
methods: ['GET', 'POST']
},
transports: ['websocket', 'polling'],
allowEIO3: true,
pingTimeout: 60000,
pingInterval: 25000,
cookie: false
});

// Store online users in memory
const onlineUsers = new Map();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
try {
const token = socket.handshake.auth.token;

if (!token) {
    console.log('❌ No token provided for socket connection');
    return next(new Error('Authentication error: No token provided'));
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Check if user exists in database
const userResult = await db.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [decoded.id || decoded.userId]
);

if (userResult.rows.length === 0) {
    console.log(`❌ User not found in database: ${decoded.id}`);
    return next(new Error('Authentication error: User not found'));
}

const user = userResult.rows[0];
socket.userId = user.id;
socket.username = user.username;
socket.email = user.email;

console.log(`🔐 Socket authenticated for user: ${user.username} (${user.id})`);
next();
} catch (err) {
console.error('❌ Socket auth error:', err.message);
next(new Error('Authentication error: Invalid token'));
}
});

// Socket.IO connection handler
io.on('connection', (socket) => {
console.log(`🔌 New socket connection: ${socket.id} for user: ${socket.username} (${socket.userId})`);

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
    .filter(([userId, _]) => userId !== socket.userId) // EXCLUDE CURRENT USER
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

console.log(`👥 Sending ${onlineUsersList.length} online users to ${socket.username}`);

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
    
    if (!conversationId || !content || content.trim() === '') {
    return socket.emit('error', { message: 'Invalid message data' });
    }

    console.log(`📨 New message from ${socket.username} in conversation ${conversationId}`);

    // Verify conversation exists and user is a participant
    const convResult = await db.query(
    `SELECT cp.conversation_id 
        FROM conversation_participants cp 
        WHERE cp.conversation_id = $1 AND cp.user_id = $2`,
    [conversationId, socket.userId]
    );

    if (convResult.rows.length === 0) {
    return socket.emit('error', { message: 'Not a participant in this conversation' });
    }

    // Save message to database
    const messageResult = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, content, created_at) 
        VALUES ($1, $2, $3, NOW()) 
        RETURNING id, conversation_id, sender_id, content, created_at`,
    [conversationId, socket.userId, content.trim()]
    );

    const message = messageResult.rows[0];

    // Get all participants in the conversation
    const participantsResult = await db.query(
    `SELECT user_id FROM conversation_participants 
        WHERE conversation_id = $1`,
    [conversationId]
    );

    const participants = participantsResult.rows.map(row => row.user_id);

    // Prepare message data for emission
    const messageData = {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    senderName: socket.username,
    content: message.content,
    timestamp: message.created_at,
    read: false
    };

    // Emit to all participants who are online
    participants.forEach(userId => {
    if (onlineUsers.has(userId)) {
        const userSocketId = onlineUsers.get(userId).socketId;
        io.to(userSocketId).emit('message:new', messageData);
    }
    
    // Create notification for offline users
    if (userId !== socket.userId) {
        db.query(
        `INSERT INTO notifications (user_id, type, content, related_id) 
            VALUES ($1, 'message', $2, $3)`,
        [userId, `New message from ${socket.username}`, message.id]
        ).catch(err => console.error('Error creating notification:', err));
    }
    });

    // Update conversation's updated_at timestamp
    await db.query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
    );

    // Send confirmation to sender
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

    console.log(`🤝 Collaboration request from ${socket.username} for track ${trackId}`);

    // Get track owner from database
    const trackResult = await db.query(
    'SELECT user_id, title FROM tracks WHERE id = $1',
    [trackId]
    );
    
    if (trackResult.rows.length === 0) {
    return socket.emit('error', { message: 'Track not found' });
    }
    
    const trackOwnerId = trackResult.rows[0].user_id;
    const trackTitle = trackResult.rows[0].title;

    // Check if user is requesting their own track
    if (trackOwnerId === socket.userId) {
    return socket.emit('error', { message: 'Cannot request collaboration on your own track' });
    }

    // Check if request already exists
    const existingRequest = await db.query(
    'SELECT id FROM collaboration_requests WHERE track_id = $1 AND collaborator_id = $2',
    [trackId, socket.userId]
    );

    if (existingRequest.rows.length > 0) {
    return socket.emit('error', { message: 'Collaboration request already sent' });
    }

    // Create collaboration request
    const collabResult = await db.query(
    `INSERT INTO collaboration_requests 
        (track_id, collaborator_id, message, status, created_at) 
        VALUES ($1, $2, $3, 'pending', NOW()) 
        RETURNING id, track_id, collaborator_id, message, status, created_at`,
    [trackId, socket.userId, message]
    );

    const request = collabResult.rows[0];

    // Prepare request data for Socket.IO
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

    // Notify track owner if online
    if (onlineUsers.has(trackOwnerId)) {
    const ownerSocketId = onlineUsers.get(trackOwnerId).socketId;
    io.to(ownerSocketId).emit('collaboration:request', requestData);
    }

    // Create notification for track owner
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) 
        VALUES ($1, 'collaboration_request', $2, $3)`,
    [trackOwnerId, `${socket.username} wants to collaborate on "${trackTitle}"`, request.id]
    );

    // Confirm to requester
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

// Handle collaboration response (from track owner)
socket.on('collaboration:respond', async (data) => {
try {
    const { requestId, status, message } = data;
    
    if (!requestId || !status) {
    return socket.emit('error', { message: 'Missing required fields' });
    }

    console.log(`🤝 Collaboration response from ${socket.username} for request ${requestId}`);

    // Get collaboration request details
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

    // Verify user owns the track
    const trackOwnerResult = await db.query(
    'SELECT user_id FROM tracks WHERE id = $1',
    [request.track_id]
    );

    if (trackOwnerResult.rows[0].user_id !== socket.userId) {
    return socket.emit('error', { message: 'Not authorized to respond to this request' });
    }

    // Update request status
    await db.query(
    'UPDATE collaboration_requests SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, requestId]
    );

    // If approved, update track status
    if (status === 'approved') {
    await db.query(
        'UPDATE tracks SET status = $1 WHERE id = $2',
        ['in_progress', request.track_id]
    );
    }

    // Get requester's username for notification
    const requesterResult = await db.query(
    'SELECT username FROM users WHERE id = $1',
    [request.collaborator_id]
    );

    const requesterUsername = requesterResult.rows[0]?.username || 'Unknown';

    // Create notification for requester
    await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) 
        VALUES ($1, 'collaboration_response', $2, $3)`,
    [
        request.collaborator_id,
        `Your collaboration request for "${request.track_title}" was ${status}`,
        requestId
    ]
    );

    // Prepare response data for Socket.IO
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

    // Notify requester if online
    if (onlineUsers.has(request.collaborator_id)) {
    const requesterSocketId = onlineUsers.get(request.collaborator_id).socketId;
    io.to(requesterSocketId).emit('collaboration:response', responseData);
    }

    // Confirm to respondent
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

// ============ TYPING INDICATOR ============
socket.on('user:typing', (data) => {
try {
    const { conversationId, isTyping } = data;
    
    if (!conversationId) {
    return;
    }

    // Get other participants in the conversation
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

// ============ CONVERSATION ROOMS ============
socket.on('join:conversation', (conversationId) => {
socket.join(`conversation:${conversationId}`);
console.log(`💬 User ${socket.username} joined conversation: ${conversationId}`);

// Update last read timestamp
db.query(
    `UPDATE conversation_participants 
    SET last_read_at = NOW() 
    WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, socket.userId]
).catch(err => console.error('Error updating last read:', err));
});

socket.on('leave:conversation', (conversationId) => {
socket.leave(`conversation:${conversationId}`);
console.log(`💬 User ${socket.username} left conversation: ${conversationId}`);
});

// ============ HEARTBEAT ============
socket.on('heartbeat', () => {
// Update last activity in database
db.query(
    'UPDATE online_users SET last_activity = NOW() WHERE user_id = $1',
    [socket.userId]
).catch(err => console.error('Error updating heartbeat:', err));
});

// ============ DISCONNECT HANDLING ============
socket.on('disconnect', () => {
console.log(`🔌 Socket disconnected: ${socket.id} for user: ${socket.username} (${socket.userId})`);

// Remove from online users
onlineUsers.delete(socket.userId);

// Remove from database
db.query(
    'DELETE FROM online_users WHERE user_id = $1',
    [socket.userId]
).catch(err => console.error('Error removing online user:', err));

// Notify other users
socket.broadcast.emit('user:offline', {
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date().toISOString()
});

console.log(`👥 Online users remaining: ${onlineUsers.size}`);
});
});

// Health check endpoint
app.get('/health', (req, res) => {
res.json({
status: 'ok',
timestamp: new Date().toISOString(),
env: process.env.NODE_ENV,
onlineUsers: onlineUsers.size,
services: {
    database: 'connected',
    socketio: 'running'
}
});
});

// Socket.IO status endpoint
app.get('/socket-status', (req, res) => {
res.json({
connectedUsers: onlineUsers.size,
users: Array.from(onlineUsers.values()).map(user => ({
    id: user.userId,
    username: user.username,
    connectedAt: user.connectedAt
}))
});
});

// Database connection verification
const verifyDbConnection = async () => {
try {
const result = await db.query('SELECT NOW()');
console.log('✅ Connected to PostgreSQL database at:', result.rows[0].now);
} catch (err) {
console.error('❌ Database connection error:', err.message);
process.exit(1);
}
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/online', onlineRoutes);

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

// 404 handler
app.use((req, res) => {
res.status(404).json({ 
error: { 
    message: `Route [${req.method}] ${req.url} not found` 
} 
});
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
console.log(`🚀 TrackBackAI API running on port ${PORT}`);
console.log(`🔌 Socket.IO server ready`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3005'}`);
console.log(`📡 Socket.IO transport: websocket, polling`);

// Clean up old online users on startup
await db.query('DELETE FROM online_users').catch(() => {
console.log('⚠️  online_users table might not exist yet');
});

await verifyDbConnection();
});

// Export for testing
module.exports = { app, server, io, onlineUsers };