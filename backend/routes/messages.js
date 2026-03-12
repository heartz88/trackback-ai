const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');
const { triggerNotificationEmail } = require('../config/emailTrigger');
const { onlineUsers } = require('../server');

async function persistMessage(conversationId, senderId, content) {
// Insert the message
const messageResult = await db.query(
`INSERT INTO messages (conversation_id, sender_id, content, created_at, read_by)
    VALUES ($1, $2, $3, NOW(), ARRAY[]::INTEGER[])
    RETURNING id, conversation_id, sender_id, content, created_at`,
[conversationId, senderId, content.trim()]
);

// Update conversation's updated_at so it floats to the top of the list
await db.query(
'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
[conversationId]
);

const row = messageResult.rows[0];

// Fetch sender name
const senderResult = await db.query(
'SELECT username FROM users WHERE id = $1',
[senderId]
);

return {
id: row.id,
conversationId: row.conversation_id,
senderId: row.sender_id,
senderName: senderResult.rows[0]?.username || 'Unknown',
content: row.content,
timestamp: row.created_at,
read: false,
read_by: []
};
}

// ============================================================
// Attach socket handler
// ============================================================
function attachSocketHandler(io) {
io.on('connection', (socket) => {
const userId = socket.user?.id;
if (!userId) return;

// ── Join conversation room ──────────────────────────
socket.on('join:conversation', (conversationId) => {
    const room = `conversation:${conversationId}`;
    socket.join(room);
});

// ── Leave conversation room ─────────────────────────
socket.on('leave:conversation', (conversationId) => {
    const room = `conversation:${conversationId}`;
    socket.leave(room);
});

// ── Send message ────────────────────────────────────
socket.on('message:send', async ({ conversationId, content }) => {
    try {
        if (!content || !content.trim()) return;

        // Verify user is a participant before saving
        const check = await db.query(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [conversationId, userId]
        );
        if (check.rows.length === 0) {
            socket.emit('message:error', { error: 'Not a participant in this conversation' });
            return;
        }

        // Persist to DB
        const savedMessage = await persistMessage(conversationId, userId, content);

        // Broadcast the saved message to everyone in the room
        io.to(`conversation:${conversationId}`).emit('message:new', savedMessage);

        // Email the other participant(s) if they're not online
        try {
            const others = await db.query(
                `SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2`,
                [conversationId, userId]
            );
            for (const row of others.rows) {
                const otherUserId = parseInt(row.user_id);
                if (!onlineUsers?.has(otherUserId)) {
                    console.log(`[messages] User ${otherUserId} is offline, sending message email`);
                    triggerNotificationEmail(db, otherUserId, 'message', {
                        senderName: savedMessage.senderName,
                        conversationId,
                    });
                } else {
                    console.log(`[messages] User ${otherUserId} is online, skipping email`);
                }
            }
        } catch (err) {
            console.error('[messages] Error checking online status for email:', err.message);
        }

    } catch (err) {
        console.error('Error saving socket message:', err);
        socket.emit('message:error', { error: 'Failed to send message' });
    }
});

// ── Typing indicator ────────────────────────────────
socket.on('user:typing', ({ conversationId, isTyping }) => {
    socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId,
        conversationId,
        isTyping
    });
});
});
}

// ============================================================
// REST ROUTES
// ============================================================

// Start or get conversation with a user
router.post('/conversations', authMiddleware, async (req, res) => {
try {
const { participantId } = req.body;
const userId = req.user.id;

if (!participantId) {
    return res.status(400).json({ error: { message: 'Participant ID is required' } });
}

const parsedParticipantId = parseInt(participantId);
if (isNaN(parsedParticipantId)) {
    return res.status(400).json({ error: { message: 'Invalid participant ID' } });
}

if (parsedParticipantId === userId) {
    return res.status(400).json({ error: { message: 'Cannot start conversation with yourself' } });
}

// Check both users exist
const usersCheck = await db.query(
    'SELECT id, username FROM users WHERE id IN ($1, $2)',
    [userId, parsedParticipantId]
);

if (usersCheck.rows.length !== 2) {
    const foundUserIds = usersCheck.rows.map(r => r.id);
    if (!foundUserIds.includes(userId)) {
        return res.status(404).json({ error: { message: 'Your user account was not found in database' } });
    }
    return res.status(404).json({ error: { message: 'Recipient user not found' } });
}

// Check if conversation already exists
const existingConversation = await db.query(
    `SELECT c.id as conversation_id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE cp1.user_id = $1 AND cp2.user_id = $2`,
    [userId, parsedParticipantId]
);

let conversationId;
let isNew = false;

if (existingConversation.rows.length > 0) {
    conversationId = existingConversation.rows[0].conversation_id;
} else {
    isNew = true;
    const conversationResult = await db.query(
        'INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id',
        []
    );
    conversationId = conversationResult.rows[0].id;

    await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at)
            VALUES ($1, $2, NOW(), NOW()), ($1, $3, NOW(), NOW())`,
        [conversationId, userId, parsedParticipantId]
    );
}

// Fetch full conversation details
const conversationDetails = await db.query(
    `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (SELECT content   FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
        (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_timestamp,
        (SELECT sender_id  FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $2 AND NOT ($2 = ANY(m.read_by))) as unread_count,
        ARRAY_AGG(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'email', u.email)) as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        WHERE c.id = $1
        GROUP BY c.id`,
    [conversationId, userId]
);

if (conversationDetails.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Conversation not found after creation' } });
}

const conv = conversationDetails.rows[0];
const participantsArray = conv.participants || [];
const otherParticipants = participantsArray.filter(p => p.id !== userId);

let lastMessage = null;
if (conv.last_message_content) {
    lastMessage = {
        content: conv.last_message_content,
        timestamp: conv.last_message_timestamp,
        senderId: conv.last_message_sender_id,
        senderName: participantsArray.find(p => p.id === conv.last_message_sender_id)?.username || 'Unknown'
    };
}

res.status(200).json({
    message: isNew ? 'Conversation created successfully' : 'Conversation found',
    conversation: {
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        lastMessage,
        unreadCount: parseInt(conv.unread_count) || 0,
        participants: otherParticipants
    }
});
} catch (error) {
console.error('Error in /conversations endpoint:', error);
let errorMessage = 'Failed to start conversation';
if (error.code === '23503') errorMessage = 'User does not exist in database';
if (error.code === '23505') errorMessage = 'Conversation already exists';
res.status(500).json({
    error: {
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Get user's conversations
router.get('/conversations', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;

const conversations = await db.query(
    `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (SELECT m.content    FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_timestamp,
        (SELECT m.sender_id  FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND NOT ($1 = ANY(m.read_by))) as unread_count,
        ARRAY_AGG(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'email', u.email)) as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        WHERE c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
        GROUP BY c.id
        ORDER BY c.updated_at DESC`,
    [userId]
);

const formattedConversations = conversations.rows.map(conv => {
    const participantsArray = conv.participants || [];
    const otherParticipants = participantsArray.filter(p => p.id !== userId);

    let lastMessage = null;
    if (conv.last_message_content) {
        lastMessage = {
            content: conv.last_message_content,
            timestamp: conv.last_message_timestamp,
            senderId: conv.last_message_sender_id,
            senderName: participantsArray.find(p => p.id === conv.last_message_sender_id)?.username || 'You'
        };
    }

    return {
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        lastMessage,
        unreadCount: parseInt(conv.unread_count) || 0,
        participants: otherParticipants
    };
});

res.json({ conversations: formattedConversations });
} catch (error) {
console.error('Error getting conversations:', error);
res.status(500).json({
    error: {
        message: 'Failed to fetch conversations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
try {
const { conversationId } = req.params;
const userId = req.user.id;

// Verify participant
const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'Not a participant in this conversation' } });
}

// Fetch all persisted messages ordered oldest → newest
const messages = await db.query(
    `SELECT
        m.id,
        m.conversation_id   AS "conversationId",
        m.sender_id         AS "senderId",
        m.content,
        m.created_at        AS timestamp,
        m.read_at,
        m.read_by,
        u.username          AS "senderName"
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC`,
    [conversationId]
);

// Send the response FIRST
res.json({
    messages: messages.rows.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content,
        timestamp: msg.timestamp,
        read: msg.read_by && msg.read_by.includes(userId),
        is_own: msg.senderId === userId
    }))
});

// Mark messages as read — fire and forget
db.query(
    `UPDATE messages
        SET read_by = array_append(read_by, $1)
        WHERE conversation_id = $2
        AND sender_id != $1
        AND NOT ($1 = ANY(read_by))`,
    [userId, conversationId]
).catch(() => {});

db.query(
    `UPDATE conversation_participants
        SET last_read_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
).catch(() => {});
} catch (error) {
console.error('Error getting messages:', error);
res.status(500).json({
    error: {
        message: 'Failed to fetch messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Mark conversation as read
router.post('/conversations/:conversationId/read', authMiddleware, async (req, res) => {
try {
const { conversationId } = req.params;
const userId = req.user.id;

const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'Not a participant in this conversation' } });
}

await db.query(
    `UPDATE messages
        SET read_by = array_append(read_by, $1)
        WHERE conversation_id = $2
        AND sender_id != $1
        AND NOT ($1 = ANY(read_by))`,
    [userId, conversationId]
);

await db.query(
    `UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
);

res.json({ success: true, message: 'Conversation marked as read' });
} catch (error) {
console.error('Error marking conversation as read:', error);
res.status(500).json({
    error: {
        message: 'Failed to mark conversation as read',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Search users for messaging
router.get('/users/search', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
const { search = '' } = req.query;

let query = `
    SELECT u.id, u.username, u.email, u.bio, u.skills, u.created_at,
            CASE WHEN ou.user_id IS NOT NULL THEN true ELSE false END as is_online
    FROM users u
    LEFT JOIN online_users ou ON u.id = ou.user_id
    WHERE u.id != $1
`;
const params = [userId];

if (search.trim()) {
    query += ` AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.email) LIKE LOWER($2))`;
    params.push(`%${search}%`);
}

query += ` ORDER BY CASE WHEN ou.user_id IS NOT NULL THEN 0 ELSE 1 END, u.username LIMIT 50`;

const users = await db.query(query, params);

res.json({
    users: users.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills || [],
        is_online: user.is_online || false,
        createdAt: user.created_at
    }))
});
} catch (error) {
console.error('Error searching users:', error);
res.status(500).json({
    error: {
        message: 'Failed to search users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Send a message via REST
router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
try {
const { conversationId } = req.params;
const userId = req.user.id;
const { content } = req.body;

if (!content || content.trim() === '') {
    return res.status(400).json({ error: { message: 'Message content is required' } });
}

const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'Not a participant in this conversation' } });
}

const savedMessage = await persistMessage(conversationId, userId, content);

// Email the other participant(s) if they're not online
try {
    const others = await db.query(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2`,
        [conversationId, userId]
    );
    for (const row of others.rows) {
        const otherUserId = parseInt(row.user_id);
        if (!onlineUsers?.has(otherUserId)) {
            console.log(`[messages REST] User ${otherUserId} is offline, sending message email`);
            triggerNotificationEmail(db, otherUserId, 'message', {
                senderName: savedMessage.senderName,
                conversationId,
            });
        } else {
            console.log(`[messages REST] User ${otherUserId} is online, skipping email`);
        }
    }
} catch (err) {
    console.error('[messages REST] Error checking online status for email:', err.message);
}

res.status(201).json({ message: 'Message sent successfully', data: savedMessage });
} catch (error) {
console.error('Error sending message via REST:', error);
res.status(500).json({
    error: {
        message: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Get conversation by ID
router.get('/conversations/:conversationId', authMiddleware, async (req, res) => {
try {
const { conversationId } = req.params;
const userId = req.user.id;

const conversation = await db.query(
    `SELECT c.id, c.created_at, c.updated_at,
            ARRAY_AGG(jsonb_build_object('id', u.id, 'username', u.username, 'email', u.email)) as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        WHERE c.id = $1
        GROUP BY c.id`,
    [conversationId]
);

if (conversation.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Conversation not found' } });
}

const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({ error: { message: 'Not a participant in this conversation' } });
}

const participantsArray = conversation.rows[0].participants || [];
const filteredParticipants = participantsArray.filter(p => p.id !== userId);

res.json({
    conversation: {
        ...conversation.rows[0],
        participants: filteredParticipants
    }
});
} catch (error) {
console.error('Error getting conversation:', error);
res.status(500).json({
    error: {
        message: 'Failed to fetch conversation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Delete a message
router.delete('/:messageId', authMiddleware, async (req, res) => {
try {
const { messageId } = req.params;
const userId = req.user.id;

const msgResult = await db.query(
    'SELECT id, sender_id FROM messages WHERE id = $1',
    [messageId]
);

if (msgResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Message not found' } });
}

if (msgResult.rows[0].sender_id !== userId) {
    return res.status(403).json({ error: { message: 'You can only delete your own messages' } });
}

await db.query('DELETE FROM messages WHERE id = $1', [messageId]);

res.json({ message: 'Message deleted' });
} catch (error) {
console.error('Delete message error:', error);
res.status(500).json({ error: { message: 'Failed to delete message' } });
}
});

module.exports = router;
module.exports.attachSocketHandler = attachSocketHandler;