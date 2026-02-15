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
    if (onlineUsers instanceof Set) return onlineUsers;
    if (Array.isArray(onlineUsers)) return new Set(onlineUsers.map(u => u.id || u));
    if (typeof onlineUsers === 'object' && onlineUsers !== null)
        return new Set(Object.keys(onlineUsers).map(k => parseInt(k)));
    return new Set();
}, [onlineUsers]);

const currentOnlineUsers = onlineUsersSet();
const onlineCount = currentOnlineUsers.size;

const fetchConversations = useCallback(async () => {
    try {
        setLoadingConversations(true);
        const response = await api.get('/messages/conversations');
        const conversationsData = response.data.conversations || [];
        setConversations(conversationsData);

        if (conversationId && conversationsData.length > 0) {
            const conv = conversationsData.find(c => c.id.toString() === conversationId);
            if (conv) setSelectedConversation(conv);
        }
    } catch (err) {
        console.error('Failed to fetch conversations:', err);
    } finally {
        setLoadingConversations(false);
    }
}, [conversationId]);

const fetchUsers = useCallback(async () => {
    try {
        const response = await api.get('/messages/users/search', { params: { search: '' } });
        setUsers(response.data.users || []);
    } catch (err) {
        console.error('Failed to fetch users:', err);
    }
}, []);

useEffect(() => {
    fetchConversations();
    fetchUsers();
}, [fetchConversations, fetchUsers]);

useEffect(() => {
    if (selectedConversation && isConnected && !hasJoinedConversation.current) {
        joinConversation(selectedConversation.id);
        hasJoinedConversation.current = true;
    }
    return () => {
        if (selectedConversation && hasJoinedConversation.current) {
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
            const response = await api.get(`/messages/conversations/${selectedConversation.id}/messages`);
            setMessages(response.data.messages || []);
            api.post(`/messages/conversations/${selectedConversation.id}/read`).catch(() => {});
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchMessages();
}, [selectedConversation]);

useEffect(() => {
    const handleNewMessage = (message) => {
        if (selectedConversation && message.conversationId?.toString() === selectedConversation.id.toString()) {
            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        }

        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === message.conversationId) {
                    return { ...conv, lastMessage: message, unreadCount: selectedConversation?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1 };
                }
                return conv;
            })
        );
    };

    const handleTypingStatus = (data) => {
        if (selectedConversation && data.conversationId?.toString() === selectedConversation.id.toString()) {
            setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
            if (data.isTyping) {
                setTimeout(() => setTypingUsers(prev => ({ ...prev, [data.userId]: false })), 3000);
            }
        }
    };

    const unsubscribeMessage = socketService.on('message:new', handleNewMessage);
    const unsubscribeTyping = socketService.on('user:typing', handleTypingStatus);
    return () => {
        unsubscribeMessage();
        unsubscribeTyping();
    };
}, [selectedConversation]);

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !isConnected) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(selectedConversation.id, false);

    sendMessage(selectedConversation.id, messageContent);
};

const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedConversation || !isConnected) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(selectedConversation.id, true);
    typingTimeoutRef.current = setTimeout(() => setTypingStatus(selectedConversation.id, false), 1000);
};

const startConversation = async (otherUser) => {
    setStartingConversation(true);
    try {
        const response = await api.post('/messages/conversations', { participantId: otherUser.id });
        const conversation = response.data.conversation;
        setConversations(prev => {
            const exists = prev.some(c => c.id === conversation.id);
            if (exists) return prev;
            return [conversation, ...prev];
        });
        setSelectedConversation(conversation);
        setShowUserSearch(false);
        navigate(`/messages/${conversation.id}`);
    } catch (err) {
        console.error('Failed to start conversation:', err);
    } finally {
        setStartingConversation(false);
    }
};

const selectConversation = (conv) => {
    setSelectedConversation(conv);
    navigate(`/messages/${conv.id}`);
    hasJoinedConversation.current = false;
};

const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p.id !== user.id);
};

const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
);

return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2 animate-text-shine">Messages</h1>
                    <p className="text-[var(--text-secondary)]">Connect and collaborate with artists</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <span className="text-sm text-[var(--text-secondary)] font-medium">{onlineCount} online</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Container */}
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
                
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass-strong rounded-2xl p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Chats</h2>
                            <button
                                onClick={() => setShowUserSearch(!showUserSearch)}
                                className="p-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] text-white rounded-xl hover:scale-105 transition-transform shadow-lg shadow-[var(--accent-primary)]/20"
                                disabled={!isConnected}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* User Search */}
                        {showUserSearch && (
                            <div className="mb-4 p-4 glass rounded-xl border border-[var(--border-color)] animate-slide-down">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Chat</h3>
                                    <button
                                        onClick={() => setShowUserSearch(false)}
                                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
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
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                                />
                                <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                                    {filteredUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => startConversation(u)}
                                            disabled={startingConversation}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-tertiary)] rounded-xl transition-all group"
                                        >
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-light)] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                {currentOnlineUsers.has(u.id) && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{u.username}</p>
                                                <p className="text-xs text-[var(--text-tertiary)] truncate">{u.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {loadingConversations ? (
                                <div className="text-center py-12">
                                    <div className="music-loader mx-auto mb-4"></div>
                                    <p className="text-sm text-[var(--text-tertiary)]">Loading chats...</p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💬</div>
                                    <p className="text-[var(--text-secondary)] mb-2">No conversations yet</p>
                                    <p className="text-sm text-[var(--text-tertiary)]">Start chatting with other artists!</p>
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
                                            className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all group ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary-light)]/20 border-2 border-[var(--accent-primary)]/40'
                                                    : 'hover:bg-[var(--bg-tertiary)] border-2 border-transparent'
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-light)] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {otherParticipant.username[0].toUpperCase()}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-semibold text-[var(--text-primary)] truncate">{otherParticipant.username}</p>
                                                    {conv.lastMessage && (
                                                        <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0 ml-2">{formatTime(conv.lastMessage.timestamp)}</span>
                                                    )}
                                                </div>
                                                {conv.lastMessage && (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm text-[var(--text-secondary)] truncate">
                                                            {conv.lastMessage.senderId === user.id && 'You: '}
                                                            {conv.lastMessage.content}
                                                        </p>
                                                        {conv.unreadCount > 0 && conv.lastMessage.senderId !== user.id && (
                                                            <span className="flex-shrink-0 px-2 py-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] text-white text-xs font-bold rounded-full">
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2">
                    <div className="glass-strong rounded-2xl h-full flex flex-col overflow-hidden">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-light)] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {getOtherParticipant(selectedConversation)?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id) && (
                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                                {getOtherParticipant(selectedConversation)?.username || 'Unknown'}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {currentOnlineUsers.has(getOtherParticipant(selectedConversation)?.id) ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                        Online
                                                    </span>
                                                ) : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="music-loader mb-4"></div>
                                            <p className="text-sm text-[var(--text-tertiary)]">Loading messages...</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="text-6xl mb-4">🎵</div>
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No messages yet</h3>
                                            <p className="text-[var(--text-secondary)]">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message) => {
                                                const isOwn = message.senderId === user.id;
                                                return (
                                                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                                        <div className={`flex max-w-[75%] gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            {!isOwn && (
                                                                <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-light)] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                                                                    {message.senderName?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div
                                                                    className={`px-6 py-3 rounded-2xl shadow-lg ${
                                                                        isOwn
                                                                            ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] text-white rounded-br-sm'
                                                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-color)]'
                                                                    }`}
                                                                >
                                                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                                </div>
                                                                <div className={`text-xs text-[var(--text-tertiary)] mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                                    {formatTime(message.timestamp)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Typing Indicator */}
                                            {Object.entries(typingUsers).some(([userId, isTyping]) =>
                                                isTyping && parseInt(userId) !== user.id && parseInt(userId) === getOtherParticipant(selectedConversation)?.id
                                            ) && (
                                                <div className="flex justify-start animate-slide-up">
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-light)] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                            {getOtherParticipant(selectedConversation)?.username?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="bg-[var(--bg-tertiary)] px-6 py-3 rounded-2xl rounded-bl-sm border border-[var(--border-color)] shadow-lg">
                                                            <div className="flex gap-1.5">
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

                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} className="p-6 border-t border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={handleTyping}
                                            placeholder={isConnected ? "Type your message..." : "Connecting..."}
                                            className="flex-1 px-6 py-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all shadow-inner"
                                            disabled={!isConnected}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || !isConnected}
                                            className={`px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg ${
                                                !newMessage.trim() || !isConnected
                                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] text-white hover:scale-105 hover:shadow-xl shadow-[var(--accent-primary)]/30'
                                            }`}
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8">
                                <div className="text-8xl mb-6 animate-float">💬</div>
                                <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-3 animate-text-shine">Select a conversation</h3>
                                <p className="text-[var(--text-secondary)] text-center max-w-md mb-8">
                                    Choose a chat from the sidebar or start a new conversation
                                </p>
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    className={`px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg ${
                                        !isConnected
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] text-white hover:scale-105 hover:shadow-xl shadow-[var(--accent-primary)]/30'
                                    }`}
                                    disabled={!isConnected}
                                >
                                    Start New Chat
                                </button>
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