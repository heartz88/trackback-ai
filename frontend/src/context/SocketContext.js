import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
const { user, token } = useAuth(); 
const [isConnected, setIsConnected] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [onlineUsers, setOnlineUsers] = useState(new Set());
const [connectionError, setConnectionError] = useState(null);

// Connect socket when user is authenticated
useEffect(() => {
if (user && token) { 
    console.log('🔄 Connecting socket with token for user:', user.username);
    
    const connectSocket = async () => {
    try {
        setConnectionError(null);
        await socketService.connect(token); 
    } catch (error) {
        console.error('❌ Failed to connect socket:', error.message);
        setConnectionError(error.message);
    }
    };

    connectSocket();

    // Listen for connection status
    const handleConnect = () => {
    console.log('✅ Socket connected in context');
    setIsConnected(true);
    setConnectionError(null);
    };
    
    const handleDisconnect = () => {
    console.log('🔌 Socket disconnected in context');
    setIsConnected(false);
    };

    const handleConnectionEstablished = (data) => {
    console.log('🎯 Connection established in context:', data);
    setIsConnected(true);
    setConnectionError(null);
    };

    const handleConnectionFailed = (data) => {
    console.error('❌ Socket connection failed:', data.error);
    setConnectionError(data.error);
    setIsConnected(false);
    };

    // Message handlers
    const handleNewMessage = (message) => {
    console.log('📩 New message in context:', message);
    // The room broadcast means you receive your own message:new event too,
    // which was incorrectly adding a notification for the sender.
    if (message.senderId === user?.id) return;
    setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'message',
        data: message,
        read: false,
        timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
    };

    const handleCollaborationRequest = (data) => {
    console.log('🤝 Collaboration request in context:', data);
    setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'collaboration_request',
        data,
        read: false,
        timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
    };

    const handleCollaborationResponse = (data) => {
    console.log('🤝 Collaboration response in context:', data);
    setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'collaboration_response',
        data,
        read: false,
        timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
    };

    // Handle online users properly
    const handleUsersOnline = (data) => {
    console.log('👥 Online users event received:', data);
    if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
        const onlineUserIds = new Set(data.onlineUsers.map(user => user.id));
        console.log('👥 Setting online users to:', Array.from(onlineUserIds));
        setOnlineUsers(onlineUserIds);
    }
    };

    const handleUserOnline = (data) => {
    console.log('🟢 User online event:', data);
    setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        console.log('🟢 Updated online users:', Array.from(newSet));
        return newSet;
    });
    };

    const handleUserOffline = (data) => {
    console.log('🔴 User offline event:', data);
    setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        console.log('🔴 Updated online users:', Array.from(newSet));
        return newSet;
    });
    };

    // Subscribe to socket events
    const unsubscribeConnected = socketService.on('socket:connected', handleConnect);
    const unsubscribeDisconnected = socketService.on('socket:disconnected', handleDisconnect);
    const unsubscribeConnectionEstablished = socketService.on('connection:established', handleConnectionEstablished);
    const unsubscribeConnectionFailed = socketService.on('socket:connection_failed', handleConnectionFailed);
    const unsubscribeNewMessage = socketService.on('message:new', handleNewMessage);
    const unsubscribeCollaborationRequest = socketService.on('collaboration:request', handleCollaborationRequest);
    const unsubscribeCollaborationResponse = socketService.on('collaboration:response', handleCollaborationResponse);
    const unsubscribeUsersOnline = socketService.on('users:online', handleUsersOnline);
    const unsubscribeUserOnline = socketService.on('user:online', handleUserOnline);
    const unsubscribeUserOffline = socketService.on('user:offline', handleUserOffline);

    // Setup heartbeat interval
    const heartbeatInterval = setInterval(() => {
    if (socketService.isConnected()) {
        socketService.sendHeartbeat();
    }
    }, 30000);

    return () => {
    console.log('🧹 Cleaning up socket listeners');
    clearInterval(heartbeatInterval);
    unsubscribeConnected();
    unsubscribeDisconnected();
    unsubscribeConnectionEstablished();
    unsubscribeConnectionFailed();
    unsubscribeNewMessage();
    unsubscribeCollaborationRequest();
    unsubscribeCollaborationResponse();
    unsubscribeUsersOnline();
    unsubscribeUserOnline();
    unsubscribeUserOffline();
    
    // Only disconnect if user logs out completely
    if (!user) {
        socketService.disconnect();
    }
    };
} else {
    console.log('👤 No user or token, disconnecting socket');
    socketService.disconnect();
    setIsConnected(false);
    setOnlineUsers(new Set());
    setConnectionError(null);
}
}, [user, token]); 

const markAsRead = (notificationId) => {
setNotifications(prev =>
    prev.map(notif =>
    notif.id === notificationId ? { ...notif, read: true } : notif
    )
);
setUnreadCount(prev => Math.max(0, prev - 1));
};

const markAllAsRead = () => {
setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
setUnreadCount(0);
};

const clearNotifications = () => {
setNotifications([]);
setUnreadCount(0);
};

// Message functions with connection check
const sendMessage = useCallback((conversationId, content) => {
if (!isConnected) {
    console.warn('⚠️ Cannot send message: Socket not connected');
    return false;
}
return socketService.sendMessage(conversationId, content);
}, [isConnected]);

const sendCollaborationRequest = useCallback((trackId, message) => {
if (!isConnected) {
    console.warn('⚠️ Cannot send collaboration request: Socket not connected');
    return false;
}
return socketService.sendCollaborationRequest(trackId, message);
}, [isConnected]);

const respondToCollaboration = useCallback((requestId, status, message = '') => {
if (!isConnected) {
    console.warn('⚠️ Cannot respond to collaboration: Socket not connected');
    return false;
}
return socketService.respondToCollaboration(requestId, status, message);
}, [isConnected]);

const setTypingStatus = useCallback((conversationId, isTyping) => {
if (!isConnected) {
    console.warn('⚠️ Cannot set typing status: Socket not connected');
    return false;
}
return socketService.setTypingStatus(conversationId, isTyping);
}, [isConnected]);

const joinConversation = useCallback(async (conversationId) => {
if (!isConnected) {
    console.warn(`⚠️ Socket not connected, waiting for connection before joining conversation ${conversationId}`);
    try {
    // Wait for connection
    await socketService.waitForConnection();
    console.log(`✅ Connected, now joining conversation ${conversationId}`);
    return socketService.joinConversation(conversationId);
    } catch (error) {
    console.error(`❌ Failed to connect for conversation ${conversationId}:`, error.message);
    return false;
    }
}
return socketService.joinConversation(conversationId);
}, [isConnected]);

const leaveConversation = useCallback((conversationId) => {
if (!isConnected) {
    console.warn(`⚠️ Cannot leave conversation ${conversationId}: Socket not connected`);
    return false;
}
return socketService.leaveConversation(conversationId);
}, [isConnected]);

const reconnect = useCallback(async () => {
if (token) {
    try {
    setConnectionError(null);
    await socketService.connect(token);
    return true;
    } catch (error) {
    setConnectionError(error.message);
    return false;
    }
}
return false;
}, [token]);

const value = {
isConnected,
notifications,
unreadCount,
onlineUsers,
connectionError,
markAsRead,
markAllAsRead,
clearNotifications,
sendMessage,
sendCollaborationRequest,
respondToCollaboration,
setTypingStatus,
joinConversation,
leaveConversation,
reconnect,
emit: socketService.emit.bind(socketService),
on: socketService.on.bind(socketService),
off: socketService.off.bind(socketService)
};

return (
<SocketContext.Provider value={value}>
    {children}
</SocketContext.Provider>
);
}

export function useSocket() {
const context = useContext(SocketContext);
if (!context) {
throw new Error('useSocket must be used within a SocketProvider');
}
return context;
}