import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import socketService from '../services/socket';

function MessagesPage() {
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

const hasJoinedConversation = useRef(false);

const onlineUsersSet = useCallback(() => {
    if (onlineUsers instanceof Set) {
        return onlineUsers;
    } else if (Array.isArray(onlineUsers)) {
        return new Set(onlineUsers.map(u => u.id || u));
    } else if (typeof onlineUsers === 'object' && onlineUsers !== null) {
        return new Set(Object.keys(onlineUsers).map(k => parseInt(k)));
    }
    return new Set();
}, [onlineUsers]);

const currentOnlineUsers = onlineUsersSet();

// ✅ FIXED: Fetch conversations with proper dependency
const fetchConversations = useCallback(async () => {
    try {
        setLoadingConversations(true);
        console.log('📨 Fetching conversations...');

        const response = await api.get('/messages/conversations');
        const conversationsData = response.data.conversations || [];

        console.log('✅ Conversations fetched:', conversationsData.length);
        setConversations(conversationsData);


        if (conversationId && conversationsData.length > 0) {
            const conv = conversationsData.find(c => c.id.toString() === conversationId);
            if (conv) {
                console.log('🔍 Auto-selecting conversation from URL:', conv.id);
                setSelectedConversation(conv);
            } else {
                console.warn(`⚠️ Conversation ${conversationId} not found`);
            }
        }
    } catch (err) {
        console.error('❌ Failed to fetch conversations:', err);
    } finally {
        setLoadingConversations(false);
    }
}, [conversationId]);


const fetchUsers = useCallback(async () => {
    try {
        const response = await api.get('/messages/users/search', { params: { search: '' } });
        setUsers(response.data.users || []);
    } catch (err) {
        console.error('❌ Failed to fetch users:', err);
    }
}, []);

useEffect(() => {
    fetchConversations();
    fetchUsers();
}, [fetchConversations, fetchUsers]);

useEffect(() => {
    if (selectedConversation && isConnected && !hasJoinedConversation.current) {
        console.log(`💬 Joining conversation: ${selectedConversation.id}`);
        joinConversation(selectedConversation.id);
        hasJoinedConversation.current = true;
    }

    return () => {
        if (selectedConversation && hasJoinedConversation.current) {
            console.log(`👋 Leaving conversation ${selectedConversation.id}`);
            leaveConversation(selectedConversation.id);
            hasJoinedConversation.current = false;
        }
    };
}, [selectedConversation, isConnected, joinConversation, leaveConversation]);


useEffect(() => {
    if (!selectedConversation) {
        setMessages([]);
        setLoading(false);
        return;
    }

    const fetchMessages = async () => {
        setLoading(true);
        try {
            console.log(`📩 Fetching messages for conversation ${selectedConversation.id}`);

            const response = await api.get(`/messages/conversations/${selectedConversation.id}/messages`);
            const messagesData = response.data.messages || [];

            console.log(`✅ Loaded ${messagesData.length} messages`);
            setMessages(messagesData);

            // Mark as read
            await api.post(`/messages/conversations/${selectedConversation.id}/read`).catch(err => {
                console.warn('Failed to mark as read:', err);
            });
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
}, [selectedConversation, navigate]);


useEffect(() => {
    const handleNewMessage = (message) => {
        console.log('📨 New message received:', message);
        
        // If message is for current conversation, add it
        if (selectedConversation && message.conversationId?.toString() === selectedConversation.id.toString()) {
            setMessages(prev => {
                // Prevent duplicates
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
        }

        // Update last message in conversations list
        // ✅ FIX: conv.id is a number, message.conversationId arrives as a
        // string from the socket. Strict === always failed, so React fell
        // through and updated EVERY conversation with the new lastMessage.
        setConversations(prev => prev.map(conv => {
            if (conv.id.toString() === message.conversationId?.toString()) {
                return {
                    ...conv,
                    lastMessage: message,
                    unreadCount: selectedConversation?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1
                };
            }
            return conv;
        }));
    };


    const handleTypingStatus = (data) => {
        console.log('⌨️ Typing status:', data);
        if (selectedConversation && data.conversationId?.toString() === selectedConversation.id.toString()) {
            setTypingUsers(prev => ({
                ...prev,
                [data.userId]: data.isTyping
            }));

            // Clear typing after 3 seconds if still showing
            if (data.isTyping) {
                setTimeout(() => {
                    setTypingUsers(prev => ({
                        ...prev,
                        [data.userId]: false
                    }));
                }, 3000);
            }
        }
    };

    const unsubscribeMessage = socketService.on('message:new', handleNewMessage);
    const unsubscribeTyping = socketService.on('user:typing', handleTypingStatus);

    return () => {
        unsubscribeMessage();
        unsubscribeTyping();
    };
}, [selectedConversation]); // ✅ FIXED: Proper dependency

// ✅ Auto-scroll to bottom when messages change
useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
}, [messages]);


const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !isConnected) {
        return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(selectedConversation.id, false);

    // No optimistic message — the server saves to DB first, then broadcasts
    // message:new with the real DB id. handleNewMessage appends it cleanly.
    // Adding a temp message here caused duplicates (temp id !== real DB id).
    sendMessage(selectedConversation.id, messageContent);
};

const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    setTypingStatus(selectedConversation.id, true);

    // Set timeout to set typing to false after 1 second
    typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(selectedConversation.id, false);
    }, 1000);
};

// Start a new conversation
const startConversation = async (otherUser) => {
    setStartingConversation(true);
    try {
        console.log(`💬 Starting conversation with user ${otherUser.id}`);

        const response = await api.post('/messages/conversations', {
            participantId: otherUser.id
        });

        const conversation = response.data.conversation;
        console.log('✅ Conversation started:', conversation);

        // Add to conversations list if new
        setConversations(prev => {
            const exists = prev.some(c => c.id === conversation.id);
            if (exists) return prev;
            return [conversation, ...prev];
        });

        // Select this conversation
        setSelectedConversation(conversation);
        setShowUserSearch(false);
        navigate(`/messages/${conversation.id}`);
    } catch (err) {
        console.error('❌ Failed to start conversation:', err);
        alert('Failed to start conversation: ' + (err.response?.data?.error?.message || 'Unknown error'));
    } finally {
        setStartingConversation(false);
    }
};

// Select a conversation
const selectConversation = (conv) => {
    console.log('🔍 Selecting conversation:', conv);
    setSelectedConversation(conv);
    navigate(`/messages/${conv.id}`);
    hasJoinedConversation.current = false; // Reset flag
};

// Get the other participant
const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p.id !== user.id);
};

// Format timestamp
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMins = (now - date) / (1000 * 60);
    const diffInHours = diffInMins / 60;

    if (diffInMins < 2) return 'Just now';
    if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    }
};

// Filter users
const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
);

const onlineCount = currentOnlineUsers.size;

return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Messages</h1>
                        <p className="text-[var(--text-secondary)]">Connect with other artists and collaborate</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[var(--text-secondary)] text-sm font-medium">
                                {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Connection status */}
                {!isConnected && (
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-amber-300 text-sm">
                                {connectionError ? `Connection error: ${connectionError}` : 'Connecting to server...'}
                            </span>
                        </div>
                        {connectionError && (
                            <button
                                onClick={reconnect}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-all"
                            >
                                Retry Connection
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                {/* Conversations Sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass-panel rounded-2xl p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Chats</h2>
                            <button
                                onClick={() => setShowUserSearch(!showUserSearch)}
                                className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
                                disabled={!isConnected}
                                title={!isConnected ? "Not connected" : "Start new chat"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* User Search Modal */}
                        {showUserSearch && (
                            <div className="mb-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Start New Chat</h3>
                                    <button
                                        onClick={() => setShowUserSearch(false)}
                                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                                />
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {filteredUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => startConversation(u)}
                                            disabled={startingConversation}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-all text-left disabled:opacity-50"
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{u.username}</p>
                                                <p className="text-xs text-[var(--text-tertiary)] truncate">{u.email}</p>
                                            </div>
                                            {currentOnlineUsers.has(u.id) && (
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                            )}
                                        </button>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <p className="text-center text-sm text-[var(--text-tertiary)] py-4">No users found</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {loadingConversations ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="text-sm text-[var(--text-tertiary)] mt-3">Loading chats...</p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[var(--text-tertiary)] text-sm">No conversations yet</p>
                                    <p className="text-[var(--text-tertiary)] text-xs mt-2">Start a new chat to get started</p>
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const otherParticipant = getOtherParticipant(conv);
                                    if (!otherParticipant) return null;

                                    const isSelected = selectedConversation?.id === conv.id;
                                    const isOnline = currentOnlineUsers.has(otherParticipant.id);

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => selectConversation(conv)}
                                            className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                                                isSelected
                                                    ? 'bg-primary-500/20 border border-primary-500/40'
                                                    : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {otherParticipant.username[0].toUpperCase()}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-semibold text-[var(--text-primary)] truncate">
                                                        {otherParticipant.username}
                                                    </p>
                                                    {conv.lastMessage && (
                                                        <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0 ml-2">
                                                            {formatTime(conv.lastMessage.timestamp)}
                                                        </span>
                                                    )}
                                                </div>
                                                {conv.lastMessage ? (
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-[var(--text-secondary)] truncate">
                                                            {conv.lastMessage.senderId === user.id ? 'You: ' : ''}
                                                            {conv.lastMessage.content}
                                                        </p>
                                                        {conv.unreadCount > 0 && conv.lastMessage.senderId !== user.id && (
                                                            <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-tertiary)]">No messages yet</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Panel */}
                <div className="lg:col-span-2">
                    <div className="glass-panel rounded-2xl h-full flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-[var(--border-color)]">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {getOtherParticipant(selectedConversation)?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id) && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[var(--text-primary)]">
                                                {getOtherParticipant(selectedConversation)?.username || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs text-[var(--text-tertiary)]">
                                                {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id) ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {loading ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                                            <p className="text-sm text-[var(--text-tertiary)] mt-4">Loading messages...</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <p className="text-[var(--text-secondary)]">No messages yet</p>
                                            <p className="text-sm text-[var(--text-tertiary)] mt-1">Send a message to start the conversation</p>
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
                                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                                                    >
                                                        <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
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
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* ✅ FIXED: Typing indicator */}
                                            {Object.entries(typingUsers).some(([userId, isTyping]) => 
                                                isTyping && 
                                                parseInt(userId) !== user.id && 
                                                parseInt(userId) === getOtherParticipant(selectedConversation)?.id
                                            ) && (
                                                <div className="flex justify-start mb-2">
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
                                            )}

                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Message input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-color)]">
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
                                            className={`px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg ${
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
    </div>
);
}

export default MessagesPage;