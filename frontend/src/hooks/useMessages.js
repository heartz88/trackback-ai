import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function useMessages(selectedConversation, hasJoinedConversation) {
const navigate = useNavigate();
const { user } = useAuth();
const { isConnected, sendMessage, deleteMessage, setTypingStatus,
notifications, joinConversation, leaveConversation } = useSocket();

const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);
const [newMessage, setNewMessage] = useState('');
const [typingUsers, setTypingUsers] = useState({});
const [deletingMessageId, setDeletingMessageId] = useState(null);
const [hoveredMessageId, setHoveredMessageId] = useState(null);

const messagesEndRef = useRef(null);
const messagesContainerRef = useRef(null);
const wasAtBottomRef = useRef(true);
const typingTimeoutRef = useRef(null);
const lastNotificationCount = useRef(0);

const scrollToBottom = useCallback((behavior = 'smooth') => {
messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
}, []);

const handleScroll = useCallback(() => {
const c = messagesContainerRef.current;
if (!c) return;
wasAtBottomRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 150;
}, []);

// Join/leave socket room
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
}, [selectedConversation?.id, isConnected, joinConversation, leaveConversation]);

// Fetch messages when conversation changes
useEffect(() => {
if (!selectedConversation) return;
setLoading(true);
api.get(`/messages/conversations/${selectedConversation.id}/messages`)
    .then(r => {
    setMessages(r.data.messages || []);
    api.post(`/messages/conversations/${selectedConversation.id}/read`).catch(() => {});
    setTimeout(() => scrollToBottom('auto'), 100);
    })
    .catch(err => {
    if (err.response?.status === 403) {
        navigate('/messages');
    }
    })
    .finally(() => setLoading(false));
}, [selectedConversation?.id, navigate, scrollToBottom]);

// Notification-based new messages
useEffect(() => {
if (notifications.length <= lastNotificationCount.current) return;
const latest = notifications[0];
if (latest?.type === 'message' && selectedConversation &&
    latest.data.conversationId?.toString() === selectedConversation.id.toString()) {
    setMessages(prev => prev.some(m => m.id === latest.data.id) ? prev : [...prev, latest.data]);
    if (wasAtBottomRef.current) setTimeout(() => scrollToBottom(), 100);
}
lastNotificationCount.current = notifications.length;
}, [notifications, selectedConversation?.id, scrollToBottom]);

// Socket event listeners
useEffect(() => {
const onNewMessage = (msg) => {
    if (!selectedConversation || msg.conversationId.toString() !== selectedConversation.id.toString()) return;
    setMessages(prev => {
    if (!msg.temp) {
        const filtered = prev.filter(m => !(m.temp && m.content === msg.content && m.senderId === msg.senderId));
        return filtered.some(m => m.id === msg.id) ? filtered : [...filtered, msg];
    }
    return prev.some(m => m.id === msg.id) ? prev : [...prev, msg];
    });
    if (wasAtBottomRef.current) setTimeout(() => scrollToBottom(), 100);
};

const onTyping = (data) => {
    if (!selectedConversation || data.conversationId?.toString() !== selectedConversation.id.toString()) return;
    setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
    if (data.isTyping) {
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
    }, 3000);
    }
};

const onDeleted = (data) => {
    if (!selectedConversation || data.conversationId.toString() !== selectedConversation.id.toString()) return;
    setMessages(prev => prev.filter(m => m.id !== data.messageId));
};

const onConnected = () => {
    if (selectedConversation && !hasJoinedConversation.current) {
    joinConversation(selectedConversation.id);
    hasJoinedConversation.current = true;
    }
};

const u1 = socketService.on('message:new', onNewMessage);
const u2 = socketService.on('user:typing', onTyping);
const u3 = socketService.on('message:deleted', onDeleted);
const u4 = socketService.on('socket:connected', onConnected);
return () => { u1?.(); u2?.(); u3?.(); u4?.(); clearTimeout(typingTimeoutRef.current); };
}, [selectedConversation?.id, joinConversation, scrollToBottom]);

const handleSendMessage = useCallback(async (e, toast) => {
e.preventDefault();
if (!newMessage.trim() || !selectedConversation || !isConnected) {
    if (!isConnected) toast.error('Please wait for connection.');
    return;
}
const content = newMessage.trim();
setNewMessage('');
const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
setMessages(prev => [...prev, {
    id: tempId, conversationId: selectedConversation.id,
    senderId: user.id, senderName: user.username,
    content, timestamp: new Date().toISOString(), read: false, temp: true
}]);
setTimeout(() => scrollToBottom(), 50);
if (!sendMessage(selectedConversation.id, content)) {
    setMessages(prev => prev.filter(m => m.id !== tempId));
    toast.error('Failed to send message.');
}
setTypingStatus(selectedConversation.id, false);
}, [newMessage, selectedConversation, isConnected, user, sendMessage, setTypingStatus, scrollToBottom]);

const handleTyping = useCallback((e) => {
setNewMessage(e.target.value);
if (selectedConversation && isConnected) {
    setTypingStatus(selectedConversation.id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
    setTypingStatus(selectedConversation.id, false);
    }, 2000);
}
}, [selectedConversation, isConnected, setTypingStatus]);

const handleDeleteMessage = useCallback(async (messageId, toast, confirm) => {
const ok = await confirm({ title: 'Delete message?', message: 'This will be permanently removed for everyone.', confirmText: 'Delete', danger: true });
if (!ok) return;
setDeletingMessageId(messageId);
const deleted = messages.find(m => m.id === messageId);
setMessages(prev => prev.filter(m => m.id !== messageId));
let success = isConnected && selectedConversation && deleteMessage(messageId, selectedConversation.id);
try {
    await api.delete(`/messages/${messageId}`);
    success = true;
    toast.success('Message deleted');
} catch {
    if (!success) {
    toast.error('Failed to delete message');
    if (deleted) setMessages(prev => [...prev, deleted]);
    }
}
setDeletingMessageId(null);
}, [messages, isConnected, selectedConversation, deleteMessage]);

return {
messages, setMessages,
loading, newMessage, typingUsers,
deletingMessageId, hoveredMessageId, setHoveredMessageId,
messagesEndRef, messagesContainerRef,
scrollToBottom, handleScroll,
handleSendMessage, handleTyping, handleDeleteMessage,
};
}