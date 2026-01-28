const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

// Start or get conversation with a user
router.post('/conversations', authMiddleware, async (req, res) => {
try {
console.log('=== STARTING CONVERSATION ===');
const { participantId } = req.body;
const userId = req.user.id;

console.log(`💬 Starting conversation: User ${userId} with Participant ${participantId}`);
console.log('Request body:', req.body);

if (!participantId) {
    return res.status(400).json({
    error: { message: 'Participant ID is required' }
    });
}

const parsedParticipantId = parseInt(participantId);
if (isNaN(parsedParticipantId)) {
    return res.status(400).json({
    error: { message: 'Invalid participant ID' }
    });
}

if (parsedParticipantId === userId) {
    return res.status(400).json({
    error: { message: 'Cannot start conversation with yourself' } 
    });
}

// Check if both users exist in database
console.log('Checking if both users exist...');
const usersCheck = await db.query(
    'SELECT id, username FROM users WHERE id IN ($1, $2)',
    [userId, parsedParticipantId]
);

if (usersCheck.rows.length !== 2) {
    console.log('❌ One or both users not found in database');
    const foundUserIds = usersCheck.rows.map(row => row.id);
    console.log('Found user IDs:', foundUserIds);
    console.log('Looking for user IDs:', userId, parsedParticipantId);
    
    if (!foundUserIds.includes(userId)) {
    return res.status(404).json({
        error: { message: 'Your user account was not found in database' } 
    });
    } else {
    return res.status(404).json({
        error: { message: 'Recipient user not found' }
    });
    }
}

const participant = usersCheck.rows.find(u => u.id === parsedParticipantId);
console.log('✅ Both users found. Participant:', participant.username);

// Check if conversation already exists between these two users
console.log('Checking for existing conversation...');
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
    // Return existing conversation
    conversationId = existingConversation.rows[0].conversation_id;
    console.log(`✅ Found existing conversation: ${conversationId}`);
} else {
    // Create new conversation
    console.log('Creating new conversation...');
    isNew = true;
    
    try {
    // Create conversation
    const conversationResult = await db.query(
        'INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING id',
        []
    );
    
    conversationId = conversationResult.rows[0].id;
    console.log(`✅ Created new conversation: ${conversationId}`);

    // Add both users as participants
    await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, last_read_at) 
        VALUES ($1, $2, NOW(), NOW()), ($1, $3, NOW(), NOW())`,
        [conversationId, userId, parsedParticipantId]
    );

    console.log(`✅ Added participants to conversation ${conversationId}`);
    } catch (transactionError) {
    console.error('❌ Error creating conversation:', transactionError);
    throw transactionError;
    }
}

// Get conversation details with participants
console.log('Fetching conversation details...');
const conversationDetails = await db.query(
    `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (
        SELECT content
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_content,
        (
        SELECT created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_timestamp,
        (
        SELECT sender_id
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_sender_id,
        (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.sender_id != $1
        AND NOT ($1 = ANY(m.read_by))
        ) as unread_count,
        ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
        )
        ) as participants
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN users u ON cp.user_id = u.id
    WHERE c.id = $1
    GROUP BY c.id`,
    [conversationId]
);

if (conversationDetails.rows.length === 0) {
    console.log('❌ Conversation details not found');
    return res.status(404).json({
    error: { message: 'Conversation not found after creation' } 
    });
}

const conversation = conversationDetails.rows[0];

// Filter out the current user from participants
const participantsArray = conversation.participants || [];
const otherParticipants = participantsArray.filter(p => p.id !== userId);

// Determine last message details
let lastMessage = null;
if (conversation.last_message_content) {
    const lastMessageSenderId = conversation.last_message_sender_id;
    const lastMessageSender = participantsArray.find(p => p.id === lastMessageSenderId);
    
    lastMessage = {
    content: conversation.last_message_content,
    timestamp: conversation.last_message_timestamp,
    senderId: lastMessageSenderId,
    senderName: lastMessageSender ? lastMessageSender.username : 'You'
    };
}

console.log('✅ Conversation ready, responding...');
res.status(200).json({
    message: isNew ? 'Conversation created successfully' : 'Conversation found',
    conversation: {
    id: conversation.id,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    lastMessage: lastMessage,
    unreadCount: parseInt(conversation.unread_count) || 0,
    participants: otherParticipants
    }
});

} catch (error) {
console.error('❌ Error in /conversations endpoint:', error);
console.error('Error stack:', error.stack);

// More detailed error information
let errorMessage = 'Failed to start conversation';
if (error.code === '23503') { // Foreign key violation
    errorMessage = 'User does not exist in database';
} else if (error.code === '23505') { // Unique constraint violation
    errorMessage = 'Conversation already exists';
}

res.status(500).json({
    error: {
    message: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    code: process.env.NODE_ENV === 'development' ? error.code : undefined
    }
});
}
});

// Get user's conversations
router.get('/conversations', authMiddleware, async (req, res) => {
try {
const userId = req.user.id;
console.log(`📨 Getting conversations for user ${userId}`);

const conversations = await db.query(
    `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (
        SELECT m.content
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_content,
        (
        SELECT m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_timestamp,
        (
        SELECT m.sender_id
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
        ) as last_message_sender_id,
        (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.sender_id != $1
        AND NOT ($1 = ANY(m.read_by))
        ) as unread_count,
        ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
        )
        ) as participants
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN users u ON cp.user_id = u.id
    WHERE c.id IN (
        SELECT conversation_id
        FROM conversation_participants
        WHERE user_id = $1
    )
    GROUP BY c.id
    ORDER BY c.updated_at DESC`,
    [userId]
);

console.log(`✅ Found ${conversations.rows.length} conversations for user ${userId}`);

const formattedConversations = conversations.rows.map(conv => {
    // Filter out current user from participants
    const participantsArray = conv.participants || [];
    const otherParticipants = participantsArray.filter(p => p.id !== userId);
    
    // Determine last message details
    let lastMessage = null;
    if (conv.last_message_content) {
    const lastMessageSenderId = conv.last_message_sender_id;
    const lastMessageSender = participantsArray.find(p => p.id === lastMessageSenderId);
    
    lastMessage = {
        content: conv.last_message_content,
        timestamp: conv.last_message_timestamp,
        senderId: lastMessageSenderId,
        senderName: lastMessageSender ? lastMessageSender.username : 'You'
    };
    }
    
    return {
    id: conv.id,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    lastMessage: lastMessage,
    unreadCount: parseInt(conv.unread_count) || 0,
    participants: otherParticipants
    };
});

res.json({
    conversations: formattedConversations
});
} catch (error) {
console.error('❌ Error getting conversations:', error);
console.error('Error details:', error.message);
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

console.log(`📨 Getting messages for conversation ${conversationId}, user ${userId}`);

// Verify user is a participant
const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({
    error: { message: 'Not a participant in this conversation' } 
    });
}

// Get messages
const messages = await db.query(
    `SELECT
        m.id,
        m.conversation_id as "conversationId",
        m.sender_id as "senderId",
        m.content,
        m.created_at as timestamp,
        m.read_at,
        m.read_by,
        u.username as "senderName"
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1
    ORDER BY m.created_at ASC`,
    [conversationId]
);

// Mark messages as read
await db.query(
    `UPDATE messages
    SET read_by = array_append(read_by, $1)
    WHERE conversation_id = $2
    AND sender_id != $1
    AND NOT ($1 = ANY(read_by))`,
    [userId, conversationId]
);

// Update user's last read timestamp
await db.query(
    `UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
);

console.log(`✅ Found ${messages.rows.length} messages in conversation ${conversationId}`);

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
} catch (error) {
console.error('❌ Error getting messages:', error);
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

console.log(`👁️ Marking conversation ${conversationId} as read for user ${userId}`);

// Verify user is a participant
const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({
    error: { message: 'Not a participant in this conversation' } 
    });
}

// Mark all messages as read
await db.query(
    `UPDATE messages
    SET read_by = array_append(read_by, $1)
    WHERE conversation_id = $2
    AND sender_id != $1
    AND NOT ($1 = ANY(read_by))`,
    [userId, conversationId]
);

// Update user's last read timestamp
await db.query(
    `UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
);

res.json({ success: true, message: 'Conversation marked as read' });
} catch (error) {
console.error('❌ Error marking conversation as read:', error);
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

console.log(`👥 Searching users for messaging, user ${userId}, search: "${search}"`);

let query = `
    SELECT
    u.id,
    u.username,
    u.email,
    u.bio,
    u.skills,
    u.created_at,
    CASE WHEN ou.user_id IS NOT NULL THEN true ELSE false END as is_online
    FROM users u
    LEFT JOIN online_users ou ON u.id = ou.user_id
    WHERE u.id != $1
`;

const params = [userId];

if (search.trim()) {
    query += ` AND (
    LOWER(u.username) LIKE LOWER($2) OR
    LOWER(u.email) LIKE LOWER($2)
    )`;
    params.push(`%${search}%`);
}

query += ` ORDER BY 
    CASE WHEN ou.user_id IS NOT NULL THEN 0 ELSE 1 END,
    u.username 
    LIMIT 50`;

const users = await db.query(query, params);

console.log(`✅ Found ${users.rows.length} users`);

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
console.error('❌ Error searching users:', error);
res.status(500).json({
    error: {
    message: 'Failed to search users',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

// Send a message
router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
try {
const { conversationId } = req.params;
const userId = req.user.id;
const { content } = req.body;

console.log(`📨 Sending message to conversation ${conversationId} from user ${userId}`);

if (!content || content.trim() === '') {
    return res.status(400).json({
    error: { message: 'Message content is required' }
    });
}

// Verify user is a participant
const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({
    error: { message: 'Not a participant in this conversation' }
    });
}

// Insert message
const messageResult = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, content, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, conversation_id, sender_id, content, created_at`,
    [conversationId, userId, content.trim()]
);

// Update conversation timestamp
await db.query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
);

const message = messageResult.rows[0];

// Get sender info
const senderResult = await db.query(
    'SELECT username FROM users WHERE id = $1',
    [userId]
);

console.log(`✅ Message sent with ID: ${message.id}`);

res.status(201).json({
    message: 'Message sent successfully',
    data: {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    senderName: senderResult.rows[0].username,
    content: message.content,
    timestamp: message.created_at,
    read: false
    }
});
} catch (error) {
console.error('❌ Error sending message:', error);
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

console.log(`💬 Getting conversation ${conversationId} for user ${userId}`);

const conversation = await db.query(
    `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        ARRAY_AGG(
        jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
        )
        ) as participants
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN users u ON cp.user_id = u.id
    WHERE c.id = $1
    GROUP BY c.id`,
    [conversationId]
);

if (conversation.rows.length === 0) {
    return res.status(404).json({
    error: { message: 'Conversation not found' }
    });
}

// Verify user is a participant
const participantCheck = await db.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
);

if (participantCheck.rows.length === 0) {
    return res.status(403).json({
    error: { message: 'Not a participant in this conversation' }
    });
}

// Filter out the current user from participants
const participantsArray = conversation.rows[0].participants || [];
const filteredParticipants = participantsArray.filter(p => p.id !== userId);

res.json({
    conversation: {
    ...conversation.rows[0],
    participants: filteredParticipants
    }
});
} catch (error) {
console.error('❌ Error getting conversation:', error);
res.status(500).json({
    error: {
    message: 'Failed to fetch conversation',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
});
}
});

module.exports = router;