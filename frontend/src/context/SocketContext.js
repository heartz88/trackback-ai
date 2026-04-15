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
const [connectionQueue, setConnectionQueue] = useState([]);

// Process queue when connection is established
const processQueue = useCallback(() => {
if (connectionQueue.length > 0 && isConnected) {
connectionQueue.forEach(action => {
    if (action.type === 'join') {
    socketService.joinConversation(action.conversationId);
    }
});
setConnectionQueue([]);
}
}, [connectionQueue, isConnected]);

// Connect socket when user is authenticated
useEffect(() => {
if (user && token) {
const connectSocket = async () => {
    try {
    setConnectionError(null);
    await socketService.connect(token);
    } catch (error) {
    console.error('Failed to connect socket:', error.message);
    setConnectionError(error.message);
    }
};

connectSocket();

// Listen for connection status
const handleConnect = () => {
    setIsConnected(true);
    setConnectionError(null);
    processQueue();
};

const handleDisconnect = () => {
    setIsConnected(false);
};

const handleConnectionEstablished = (data) => {
    setIsConnected(true);
    setConnectionError(null);
    processQueue();
};

const handleConnectionFailed = (data) => {
    console.error('Socket connection failed:', data.error);
    setConnectionError(data.error);
    setIsConnected(false);
};

// Message handlers
const handleNewMessage = (message) => {
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

// Handle message deleted - let it pass through to components
const handleMessageDeleted = (data) => {
    // This event will be handled by individual components
};

const handleCollaborationRequest = (data) => {
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
    setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'collaboration_response',
    data,
    read: false,
    timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
};

const handleNewSubmission = (data) => {
    setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'submission',
    data: { ...data, message: data.message || `${data.collaborator_name || 'Someone'} submitted a new version` },
    read: false,
    timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
};

const handleNewVote = (data) => {
    setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'vote',
    data: { ...data, message: data.message || 'Someone liked your submission' },
    read: false,
    timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
};

const handleNewComment = (data) => {
    setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'comment',
    data: { ...data, message: data.message || `${data.username || 'Someone'} commented on your submission` },
    read: false,
    timestamp: new Date()
    }]);
    setUnreadCount(prev => prev + 1);
};

const handleTrackNew = (data) => {
    // Pages listening to this event can update their track lists
};

const handleTrackCompleted = (data) => {
    // Pages listening to this event can update their lists
};

// Handle online users properly
const handleUsersOnline = (data) => {
    if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
    const onlineUserIds = new Set(data.onlineUsers.map(user => user.id));
    setOnlineUsers(onlineUserIds);
    }
};

const handleUserOnline = (data) => {
    setOnlineUsers(prev => {
    const newSet = new Set(prev);
    newSet.add(data.userId);
    return newSet;
    });
};

const handleUserOffline = (data) => {
    setOnlineUsers(prev => {
    const newSet = new Set(prev);
    newSet.delete(data.userId);
    return newSet;
    });
};

// Subscribe to socket events
const unsubscribeConnected = socketService.on('socket:connected', handleConnect);
const unsubscribeDisconnected = socketService.on('socket:disconnected', handleDisconnect);
const unsubscribeConnectionEstablished = socketService.on('connection:established', handleConnectionEstablished);
const unsubscribeConnectionFailed = socketService.on('socket:connection_failed', handleConnectionFailed);
const unsubscribeNewMessage = socketService.on('message:new', handleNewMessage);
const unsubscribeMessageDeleted = socketService.on('message:deleted', handleMessageDeleted);
const unsubscribeCollaborationRequest = socketService.on('collaboration:request', handleCollaborationRequest);
const unsubscribeCollaborationResponse = socketService.on('collaboration:response', handleCollaborationResponse);
const unsubscribeNewSubmission = socketService.on('submission:new', handleNewSubmission);
const unsubscribeNewVote = socketService.on('vote:new', handleNewVote);
const unsubscribeNewComment = socketService.on('comment:new', handleNewComment);
const unsubscribeTrackNew = socketService.on('track:new', handleTrackNew);
const unsubscribeTrackCompleted = socketService.on('track:completed', handleTrackCompleted);
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
    clearInterval(heartbeatInterval);
    unsubscribeConnected();
    unsubscribeDisconnected();
    unsubscribeConnectionEstablished();
    unsubscribeConnectionFailed();
    unsubscribeNewMessage();
    unsubscribeMessageDeleted();
    unsubscribeCollaborationRequest();
    unsubscribeCollaborationResponse();
    unsubscribeNewSubmission();
    unsubscribeNewVote();
    unsubscribeNewComment();
    unsubscribeTrackNew();
    unsubscribeTrackCompleted();
    unsubscribeUsersOnline();
    unsubscribeUserOnline();
    unsubscribeUserOffline();
    
    // Only disconnect if user logs out completely
    if (!user) {
    socketService.disconnect();
    }
};
} else {
socketService.disconnect();
setIsConnected(false);
setOnlineUsers(new Set());
setConnectionError(null);
setConnectionQueue([]);
}
}, [user, token, processQueue]); 

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

// Message functions with connection check and queuing
const sendMessage = useCallback((conversationId, content) => {
if (!isConnected) {
console.warn('Cannot send message: Socket not connected');
return false;
}
return socketService.sendMessage(conversationId, content);
}, [isConnected]);

// Delete message with real-time sync
const deleteMessage = useCallback((messageId, conversationId) => {
if (!isConnected) {
console.warn('Cannot delete message: Socket not connected');
return false;
}
console.log('Emitting message:delete event:', { messageId, conversationId });
return socketService.deleteMessage(messageId, conversationId);
}, [isConnected]);

const sendCollaborationRequest = useCallback((trackId, message) => {
if (!isConnected) {
console.warn('Cannot send collaboration request: Socket not connected');
return false;
}
return socketService.sendCollaborationRequest(trackId, message);
}, [isConnected]);

const respondToCollaboration = useCallback((requestId, status, message = '') => {
if (!isConnected) {
console.warn('Cannot respond to collaboration: Socket not connected');
return false;
}
return socketService.respondToCollaboration(requestId, status, message);
}, [isConnected]);

const setTypingStatus = useCallback((conversationId, isTyping) => {
if (!isConnected) {
console.warn('Cannot set typing status: Socket not connected');
return false;
}
return socketService.setTypingStatus(conversationId, isTyping);
}, [isConnected]);

const joinConversation = useCallback(async (conversationId) => {
if (!isConnected) {
console.log(`Queueing join for conversation ${conversationId} - waiting for connection`);
setConnectionQueue(prev => [...prev, { type: 'join', conversationId }]);

try {
    await socketService.waitForConnection();
} catch (error) {
    console.error(`Failed to connect for conversation ${conversationId}:`, error.message);
}
return false;
}
return socketService.joinConversation(conversationId);
}, [isConnected]);

const leaveConversation = useCallback((conversationId) => {
if (!isConnected) {
console.warn(`Cannot leave conversation ${conversationId}: Socket not connected`);
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
deleteMessage,
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