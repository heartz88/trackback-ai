import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import socketService from '../services/socket';

function MessagesPage() {
const toast = useToast();
const confirm = useConfirm();
const { conversationId } = useParams();
const navigate = useNavigate();
const { user } = useAuth();
const {
isConnected,
sendMessage,
setTypingStatus,
onlineUsers,
joinConversation,
leaveConversation,
notifications,
connectionError,
reconnect
} = useSocket();

const [conversations, setConversations] = useState([]);
const [selectedConversation, setSelectedConversation] = useState(null);
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [loading, setLoading] = useState(true);
const [loadingConversations, setLoadingConversations] = useState(true);
const [users, setUsers] = useState([]);
const [typingUsers, setTypingUsers] = useState({});
const [searchQuery, setSearchQuery] = useState('');
const [showUserSearch, setShowUserSearch] = useState(false);
const messagesEndRef = useRef(null);
const typingTimeoutRef = useRef(null);
const [startingConversation, setStartingConversation] = useState(false);
const [deletingMessageId, setDeletingMessageId] = useState(null);
const [hoveredMessageId, setHoveredMessageId] = useState(null);

const hasJoinedConversation = useRef(false);
const lastNotificationCount = useRef(0);

// Convert onlineUsers to Set if it's an array (for backward compatibility)
const onlineUsersSet = useCallback(() => {
if (onlineUsers instanceof Set) {
return onlineUsers;
} else if (Array.isArray(onlineUsers)) {
return new Set(onlineUsers.map(u => u.id || u));
} else if (typeof onlineUsers === 'object' && onlineUsers !== null) {
return new Set(Object.keys(onlineUsers));
}
return new Set();
}, [onlineUsers]);

// Get current online users as a Set
const currentOnlineUsers = onlineUsersSet();

// Delete a message
const handleDeleteMessage = async (messageId) => {
const ok = await confirm({
    title: 'Delete message?',
    message: 'This message will be permanently removed.',
    confirmText: 'Delete',
    danger: true
});
if (!ok) return;
setDeletingMessageId(messageId);
try {
    await api.delete(`/messages/${messageId}`);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast.success('Message deleted');
} catch (err) {
    toast.error('Failed to delete message');
    console.error('Delete message error:', err);
} finally {
    setDeletingMessageId(null);
}
};

// Fetch conversations list
const fetchConversations = useCallback(async () => {
try {
setLoadingConversations(true);
//;

const response = await api.get('/messages/conversations');
const conversationsData = response.data.conversations || [];

//;
setConversations(conversationsData);

// If URL has conversationId, select that conversation
if (conversationId) {
    const conv = conversationsData.find(c => c.id.toString() === conversationId);
    if (conv) {
        //;
        setSelectedConversation(conv);
    }
}
} catch (err) {
console.error('❌ Failed to fetch conversations:', err);
console.error('Error details:', err.response?.data);
} finally {
setLoadingConversations(false);
}
}, [conversationId]);

useEffect(() => {
if (selectedConversation && isConnected && !hasJoinedConversation.current) {
//;
joinConversation(selectedConversation.id);
hasJoinedConversation.current = true;
}
// Leave conversation on unmount or when changing conversations
return () => {
if (selectedConversation && hasJoinedConversation.current) {
    //;
    leaveConversation(selectedConversation.id);
    hasJoinedConversation.current = false;
}
};
}, [selectedConversation?.id, isConnected]);

// Fetch messages when selectedConversation changes
useEffect(() => {
if (!selectedConversation) return;

const fetchMessages = async () => {
setLoading(true);
try {
    //;

    const response = await api.get(`/messages/conversations/${selectedConversation.id}/messages`);
    const messagesData = response.data.messages || [];

    //;
    setMessages(messagesData);

    // Mark as read
    await api.post(`/messages/conversations/${selectedConversation.id}/read`);
} catch (err) {
    console.error('❌ Failed to fetch messages:', err);
    if (err.response?.status === 403) {
        setSelectedConversation(null);
        navigate('/messages');
    }
} finally {
    setLoading(false);
}
};

fetchMessages();
}, [selectedConversation?.id, navigate]);

// Fetch users for search
const fetchUsers = useCallback(async () => {
try {
const response = await api.get('/messages/users/search', { params: { search: '' } });
setUsers(response.data.users || []);
} catch (err) {
console.error('❌ Failed to fetch users:', err);
}
}, []);

// Initial data fetch
useEffect(() => {
fetchConversations();
fetchUsers();
}, []);

// Watch for new messages via notifications WITHOUT causing re-renders
useEffect(() => {
// Only process if we have new notifications
if (notifications.length > lastNotificationCount.current) {
const latest = notifications[0];

if (latest.type === 'message' && selectedConversation) {
    if (latest.data.conversationId?.toString() === selectedConversation.id.toString()) {
        //;
        setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === latest.data.id)) {
                return prev;
            }
            return [...prev, latest.data];
        });
    }
}

// Update conversations list WITHOUT refetching
// Just increment the count to show we've processed this notification
lastNotificationCount.current = notifications.length;
}
}, [notifications.length, selectedConversation?.id]);

// Socket event listeners
useEffect(() => {
//;

const handleNewMessage = (message) => {
//;

if (selectedConversation && message.conversationId.toString() === selectedConversation.id.toString()) {
    setMessages(prev => {
        // Prevent duplicates
        if (prev.some(m => m.id === message.id)) {
            return prev;
        }
        return [...prev, message];
    });

    // Scroll to bottom
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}
};

const handleUserTyping = (data) => {
//;

if (selectedConversation && data.conversationId?.toString() === selectedConversation.id.toString()) {
    setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
    }));

    if (data.isTyping) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => ({
                ...prev,
                [data.userId]: false
            }));
        }, 3000);
    }
}
};

const handleSocketConnected = () => {
//;
// Rejoin current conversation if there is one
if (selectedConversation && !hasJoinedConversation.current) {
    joinConversation(selectedConversation.id);
    hasJoinedConversation.current = true;
}
};

// Subscribe to socket events
const unsubscribeNewMessage = socketService.on('message:new', handleNewMessage);
const unsubscribeUserTyping = socketService.on('user:typing', handleUserTyping);
const unsubscribeSocketConnected = socketService.on('socket:connected', handleSocketConnected);

return () => {
//;
unsubscribeNewMessage?.();
unsubscribeUserTyping?.();
unsubscribeSocketConnected?.();
clearTimeout(typingTimeoutRef.current);
};
}, [selectedConversation?.id, joinConversation]);

// Scroll to bottom when messages change
useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

const handleSendMessage = async (e) => {
e.preventDefault();
if (!newMessage.trim() || !selectedConversation || !isConnected) {
console.warn('⚠️ Cannot send message:', {
    hasMessage: !!newMessage.trim(),
    hasConversation: !!selectedConversation,
    isConnected
});
if (!isConnected) {
    toast.error('Please wait for connection to establish before sending messages.');
}
return;
}

const messageContent = newMessage.trim();
setNewMessage(''); // Clear input immediately

//;

const success = sendMessage(selectedConversation.id, messageContent);
if (!success) {
console.error('❌ Failed to send message');
toast.error('Failed to send message. Please check your connection.');
}
setTypingStatus(selectedConversation.id, false);
};

const handleTyping = (e) => {
const value = e.target.value;
setNewMessage(value);

if (selectedConversation && isConnected) {
setTypingStatus(selectedConversation.id, true);
clearTimeout(typingTimeoutRef.current);
typingTimeoutRef.current = setTimeout(() => {
    setTypingStatus(selectedConversation.id, false);
}, 2000);
}
};

const handleStartConversation = async (recipientId) => {
try {
setStartingConversation(true);
//;
//;

// Make sure recipientId is a number
const parsedRecipientId = parseInt(recipientId);
if (isNaN(parsedRecipientId)) {
    toast.error('Invalid user ID');
    return;
}

if (parsedRecipientId === user.id) {
    toast.error('You cannot start a conversation with yourself');
    return;
}

//;

const response = await api.post('/messages/conversations', {
    participantId: parsedRecipientId
});

//;

const newConversation = response.data.conversation;
//;

// Replace existing entry if conversation already existed, otherwise prepend
setConversations(prev => {
    const exists = prev.some(c => c.id === newConversation.id);
    if (exists) {
        return prev.map(c => c.id === newConversation.id ? newConversation : c);
    }
    return [newConversation, ...prev];
});
setSelectedConversation(newConversation);
setShowUserSearch(false);
hasJoinedConversation.current = false; // Reset join flag

// Navigate to the new conversation
navigate(`/messages/${newConversation.id}`);

} catch (err) {
console.error('❌ Failed to start conversation - Full error:', err);

let errorMessage = 'Failed to start conversation';

if (err.response?.data?.error?.message) {
    errorMessage = err.response.data.error.message;
} else if (err.message) {
    errorMessage = err.message;
}

// Check for specific error cases
if (err.response?.status === 400) {
    if (errorMessage.includes('already exists') || errorMessage.includes('Unique constraint')) {
        // Try to find existing conversation
        const existingConv = conversations.find(c =>
            c.participants?.some(p => p.id === parseInt(recipientId))
        );
        if (existingConv) {
            //;
            setSelectedConversation(existingConv);
            hasJoinedConversation.current = false;
            navigate(`/messages/${existingConv.id}`);
            return;
        }
    }
}

toast.error(errorMessage || 'Failed to start conversation');
} finally {
setStartingConversation(false);
}
};

const handleReconnect = async () => {
//;
const success = await reconnect();
if (success) {
//;
} else {
console.error('❌ Reconnection failed');
}
};

// Helper functions for formatting
const formatTime = (timestamp) => {
if (!timestamp) return '';
const date = new Date(timestamp);
return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getOtherParticipant = (conversation) => {
if (!conversation?.participants) return null;
return conversation.participants.find(p => p.id !== user.id);
};

const filteredUsers = users.filter(u =>
u.id !== user.id &&
(u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
);

if (loadingConversations) {
return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)]">Loading messages...</p>
    </div>
</div>
);
}

return (
<div className="messages-page-root min-h-screen bg-[var(--bg-primary)] py-8 px-4 transition-colors duration-300">
<div className="max-w-7xl mx-auto">
    <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Messages</h1>
        <div className="flex flex-wrap items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-primary-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-[var(--text-secondary)]">
                {isConnected ? 'Connected' : 'Disconnected'}
                {connectionError && ` - ${connectionError}`}
            </p>
            <span className="text-[var(--text-tertiary)] text-sm">
                • {currentOnlineUsers.size} users online
            </span>
            {!isConnected && (
                <button
                    onClick={handleReconnect}
                    className="ml-auto px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-lg transition-all text-sm"
                >
                    Reconnect
                </button>
            )}
            <button
                onClick={() => setShowUserSearch(!showUserSearch)}
                className={`new-message-btn px-4 py-2 font-medium rounded-lg transition-all ${
                    startingConversation || !isConnected
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400'
                } text-white`}
                disabled={startingConversation || !isConnected}
                title={!isConnected ? "Please wait for connection" : ""}
            >
                {startingConversation ? 'Starting...' : (showUserSearch ? 'Cancel' : 'New Message')}
            </button>
        </div>
        {!isConnected && (
            <div className="mt-2 text-sm text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                ⚠️ Socket connection required for real-time messaging. Messages will still be saved but won't update in real-time.
            </div>
        )}
    </div>

    {showUserSearch && (
        <div className="messages-search-panel mb-6 glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Start New Conversation</h3>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    disabled={startingConversation || !isConnected}
                />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.length === 0 ? (
                    <p className="text-center text-[var(--text-tertiary)] py-4">
                        {searchQuery ? 'No users found' : 'Start typing to search users'}
                    </p>
                ) : (
                    filteredUsers.map(userItem => (
                        <div
                            key={userItem.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                            onClick={() => !startingConversation && isConnected && handleStartConversation(userItem.id)}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {userItem.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                {currentOnlineUsers.has(userItem.id) && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-500 rounded-full border border-[var(--bg-primary)]"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-[var(--text-primary)]">{userItem.username || 'Unknown User'}</p>
                                <p className="text-sm text-[var(--text-tertiary)]">{userItem.email}</p>
                            </div>
                            <button
                                className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-all ${
                                    startingConversation || !isConnected
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400'
                                }`}
                                disabled={startingConversation || !isConnected}
                                title={!isConnected ? "Please wait for connection" : ""}
                            >
                                {startingConversation ? '...' : 'Message'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )}

    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Left sidebar - Conversations */}
        <div className={`messages-sidebar-panel lg:w-1/3 ${!selectedConversation ? 'block' : 'hidden lg:block'} glass-panel rounded-2xl p-4 overflow-hidden flex flex-col`}>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 px-2">Conversations</h3>
                {conversations.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-[var(--text-tertiary)]">No conversations yet</p>
                        <button
                            onClick={() => setShowUserSearch(true)}
                            className="mt-3 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-medium rounded-lg transition-all"
                            disabled={!isConnected}
                        >
                            Start a conversation
                        </button>
                    </div>
                ) : (
                    conversations.map((conversation) => {
                        const otherUser = getOtherParticipant(conversation);
                        const lastMessage = conversation.lastMessage;
                        const isOnline = otherUser ? currentOnlineUsers.has(otherUser.id) : false;
                        const hasUnread = conversation.unreadCount > 0;

                        return (
                            <div
                                key={conversation.id}
                                className={`p-3 rounded-xl mb-2 cursor-pointer transition-all ${selectedConversation?.id === conversation.id
                                    ? 'bg-primary-500/10 border border-primary-500/30'
                                    : 'hover:bg-[var(--bg-tertiary)]'
                                }`}
                                onClick={() => {
                                    hasJoinedConversation.current = false;
                                    setSelectedConversation(conversation);
                                    navigate(`/messages/${conversation.id}`);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {otherUser?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-[var(--text-primary)] truncate">
                                                {otherUser?.username || 'Unknown User'}
                                            </h4>
                                            {lastMessage && (
                                                <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                                                    {formatTime(lastMessage.timestamp)}
                                                </span>
                                            )}
                                        </div>
                                        {lastMessage && (
                                            <p className={`text-sm truncate ${hasUnread ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                                                {lastMessage.senderId === user.id ? 'You: ' : ''}
                                                {lastMessage.content}
                                            </p>
                                        )}
                                        {hasUnread && (
                                            <div className="mt-1">
                                                <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Right side - Messages */}
        <div className={`messages-chat-panel flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            {selectedConversation ? (
                <>
                    {/* Chat header */}
                    <div className="messages-chat-header p-4 border-b border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedConversation(null);
                                        navigate('/messages');
                                    }}
                                    className="lg:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {getOtherParticipant(selectedConversation)?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--text-primary)]">
                                        {getOtherParticipant(selectedConversation)?.username || 'Unknown User'}
                                    </h3>
                                    <p className="text-sm text-[var(--text-tertiary)]">
                                        {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id)
                                            ? 'Online'
                                            : 'Offline'}
                                        {!isConnected && ' • Connection required for real-time'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUserSearch(true)}
                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                title="New conversation"
                                disabled={!isConnected}
                            >
                                <svg className={`w-5 h-5 ${!isConnected ? 'text-gray-500' : 'text-[var(--text-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages area */}
                    <div className="messages-area flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <svg className="w-16 h-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-[var(--text-secondary)]">No messages yet</p>
                                <p className="text-sm text-[var(--text-tertiary)]">Start the conversation!</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                                    const isOwn = message.senderId === user.id;
                                    const showTime = index === messages.length - 1 ||
                                        messages[index + 1].senderId !== message.senderId ||
                                        new Date(messages[index + 1].timestamp) - new Date(message.timestamp) > 5 * 60 * 1000;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}
                                            onMouseEnter={() => setHoveredMessageId(message.id)}
                                            onMouseLeave={() => setHoveredMessageId(null)}
                                        >
                                            <div className={`flex items-end gap-1 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isOwn && (
                                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 mr-2 flex-shrink-0">
                                                        {message.senderName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 ${isOwn
                                                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-none'
                                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-none'
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                    </div>
                                                    {showTime && (
                                                        <div className={`text-xs text-[var(--text-tertiary)] mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(message.timestamp)}
                                                            {message.read && isOwn && (
                                                                <span className="ml-1 text-primary-400">✓✓</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Delete button — only own messages, shown on hover */}
                                                {isOwn && hoveredMessageId === message.id && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(message.id)}
                                                        disabled={deletingMessageId === message.id}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all mb-1"
                                                        title="Delete message"
                                                    >
                                                        {deletingMessageId === message.id ? (
                                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Typing indicator */}
                                {isConnected && Object.entries(typingUsers).map(([userId, isTyping]) => {
                                    if (isTyping && userId !== user.id.toString() && parseInt(userId) === getOtherParticipant(selectedConversation)?.id) {
                                        return (
                                            <div key={userId} className="flex justify-start mb-2">
                                                <div className="flex">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 mr-2 flex-shrink-0">
                                                        {getOtherParticipant(selectedConversation)?.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-none px-4 py-2.5">
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Message input */}
                    <form onSubmit={handleSendMessage} className="messages-input-form p-4 border-t border-[var(--border-color)]">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                placeholder={isConnected ? "Type your message..." : "Connecting to server..."}
                                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                                disabled={!isConnected}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !isConnected}
                                className={`messages-send-btn px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg ${
                                    !newMessage.trim() || !isConnected
                                        ? 'bg-gray-700 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/20'
                                }`}
                                title={!isConnected ? "Not connected to server" : "Send message"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Select a conversation</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mb-6">
                        Choose an existing conversation from the sidebar or start a new one
                    </p>
                    <button
                        onClick={() => setShowUserSearch(true)}
                        className={`px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg ${
                            !isConnected
                                ? 'bg-gray-600 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/20'
                        }`}
                        disabled={!isConnected}
                    >
                        Start New Chat
                    </button>
                    {!isConnected && (
                        <p className="mt-3 text-sm text-amber-500">
                            ⚠️ Please wait for connection to start new chats
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
</div>
</div>
);
}
export default MessagesPage;