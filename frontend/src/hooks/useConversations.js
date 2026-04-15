import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export function useConversations() {
const { username: rawUsername } = useParams();
const username = rawUsername ? decodeURIComponent(rawUsername) : undefined;
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const { user } = useAuth();
const { joinConversation, leaveConversation, isConnected } = useSocket();

const [conversations, setConversations] = useState([]);
const [selectedConversation, setSelectedConversation] = useState(null);
const [loadingConversations, setLoadingConversations] = useState(true);
const [startingConversation, setStartingConversation] = useState(false);
const hasJoinedConversation = useRef(false);

const selectConversation = useCallback((conv) => {
setSelectedConversation(conv);
const other = conv?.participants?.find(p => p.id !== user?.id);
navigate(`/messages/${other?.username ? encodeURIComponent(other.username) : conv.id}`);
}, [navigate, user?.id]);

const fetchConversations = useCallback(async () => {
try {
    setLoadingConversations(true);
    const response = await api.get('/messages/conversations');
    const conversationsData = response.data.conversations || [];
    setConversations(conversationsData);

    const directUserId = searchParams.get('userId');
    if (directUserId) {
    try {
        const r = await api.post('/messages/conversations', { participantId: parseInt(directUserId) });
        const newConv = r.data.conversation;
        setConversations(prev => prev.some(c => c.id === newConv.id) ? prev : [newConv, ...prev]);
        setSelectedConversation(newConv);
        const other = newConv.participants?.find(p => p.id !== user?.id);
        if (other?.username) navigate(`/messages/${encodeURIComponent(other.username)}`, { replace: true });
    } catch (err) {
        console.error('Failed to start conversation from userId:', err);
    }
    } else if (username) {
    const conv = conversationsData.find(c =>
        c.participants?.some(p => p.username?.toLowerCase() === username.toLowerCase())
    );
    if (conv) {
        setSelectedConversation(conv);
    } else {
        try {
        const r = await api.get(`/messages/conversations/by-username/${username}`);
        const newConv = r.data.conversation;
        setConversations(prev => prev.some(c => c.id === newConv.id) ? prev : [newConv, ...prev]);
        setSelectedConversation(newConv);
        } catch (err) {
        console.error('Failed to load conversation by username:', err);
        }
    }
    }
} catch (err) {
    console.error('Failed to fetch conversations:', err);
} finally {
    setLoadingConversations(false);
}
}, [username]);

const startConversation = useCallback(async (recipientId, toast) => {
try {
    setStartingConversation(true);
    const parsedId = parseInt(recipientId);
    if (isNaN(parsedId) || parsedId === user?.id) {
    toast.error(isNaN(parsedId) ? 'Invalid user ID' : 'Cannot start conversation with yourself');
    return;
    }
    const response = await api.post('/messages/conversations', { participantId: parsedId });
    const newConv = response.data.conversation;
    setConversations(prev => {
    const exists = prev.some(c => c.id === newConv.id);
    return exists ? prev.map(c => c.id === newConv.id ? newConv : c) : [newConv, ...prev];
    });
    setSelectedConversation(newConv);
    hasJoinedConversation.current = false;
    const other = newConv.participants?.find(p => p.id !== user?.id);
    navigate(`/messages/${other?.username ? encodeURIComponent(other.username) : newConv.id}`);
} catch (err) {
    const msg = err.response?.data?.error?.message || 'Failed to start conversation';
    if (err.response?.status === 400 && msg.includes('already exists')) {
    const existing = conversations.find(c => c.participants?.some(p => p.id === parseInt(recipientId)));
    if (existing) {
        setSelectedConversation(existing);
        hasJoinedConversation.current = false;
        const other = existing.participants?.find(p => p.id !== user?.id);
        navigate(`/messages/${other?.username ? encodeURIComponent(other.username) : existing.id}`);
        return;
    }
    }
    toast.error(msg);
} finally {
    setStartingConversation(false);
}
}, [conversations, navigate, user?.id]);

return {
conversations, setConversations,
selectedConversation, setSelectedConversation,
loadingConversations,
startingConversation,
hasJoinedConversation,
selectConversation,
fetchConversations,
startConversation,
};
}