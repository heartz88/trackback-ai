import { io } from 'socket.io-client';

class SocketService {
constructor() {
this.socket = null;
this.token = null;
this.isConnecting = false;
this.reconnectAttempts = 0;
this.maxReconnectAttempts = 5;
this.listeners = new Map();

// Connection state
this.connected = false;
this.connectionPromise = null;
}

connect(token) {
if (this.isConnecting) {
    console.log('🔄 Already connecting, skipping...');
    return;
}

if (this.socket?.connected) {
    console.log('✅ Already connected');
    return;
}

this.token = token;
this.isConnecting = true;
this.reconnectAttempts = 0;

console.log('🔌 Connecting to Socket.IO server...');

this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: this.maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: true,
    autoConnect: true
});

// Connection event handlers
this.socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully');
    this.connected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.emitToAll('socket:connected', { socketId: this.socket.id });
});

this.socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    this.isConnecting = false;
    this.connected = false;
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('❌ Max reconnection attempts reached');
    this.emitToAll('socket:connection_failed', { error: error.message });
    }
});

this.socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${reason}`);
    this.connected = false;
    this.emitToAll('socket:disconnected', { reason });
});

this.socket.on('connection:established', (data) => {
    console.log('🎯 Server connection confirmed:', data.message);
    this.connected = true;
    this.emitToAll('connection:established', data);
});

// Forward all other events to registered listeners
this.socket.onAny((eventName, ...args) => {
    if (!eventName.startsWith('socket:') && eventName !== 'connect' && eventName !== 'disconnect') {
    this.emitToAll(eventName, ...args);
    }
});

return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
    if (!this.connected) {
        reject(new Error('Connection timeout'));
    }
    }, 10000);

    this.socket.once('connect', () => {
    clearTimeout(timeout);
    resolve(this.socket);
    });

    this.socket.once('connect_error', (error) => {
    clearTimeout(timeout);
    reject(error);
    });
});
}

disconnect() {
if (this.socket) {
    console.log('🔌 Disconnecting socket...');
    this.socket.disconnect();
    this.socket = null;
}
this.connected = false;
this.isConnecting = false;
this.token = null;
this.listeners.clear();
}

emit(eventName, data) {
if (!this.socket?.connected) {
    console.warn(`⚠️ Cannot emit ${eventName}: Socket not connected`);
    return false;
}

console.log(`📤 Emitting ${eventName}:`, data);
this.socket.emit(eventName, data);
return true;
}

on(eventName, callback) {
if (!this.listeners.has(eventName)) {
    this.listeners.set(eventName, []);
}
this.listeners.get(eventName).push(callback);

// Return unsubscribe function
return () => {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
    const index = listeners.indexOf(callback);
    if (index > -1) {
        listeners.splice(index, 1);
    }
    }
};
}

off(eventName, callback) {
const listeners = this.listeners.get(eventName);
if (listeners) {
    const index = listeners.indexOf(callback);
    if (index > -1) {
    listeners.splice(index, 1);
    }
}
}

emitToAll(eventName, ...args) {
const listeners = this.listeners.get(eventName);
if (listeners) {
    listeners.forEach(callback => {
    try {
        callback(...args);
    } catch (error) {
        console.error(`Error in ${eventName} listener:`, error);
    }
    });
}
}

// Helper methods for common operations
sendMessage(conversationId, content) {
return this.emit('message:send', { conversationId, content });
}

sendCollaborationRequest(trackId, message) {
return this.emit('collaboration:request', { trackId, message });
}

respondToCollaboration(requestId, status, message = '') {
return this.emit('collaboration:respond', { requestId, status, message });
}

setTypingStatus(conversationId, isTyping) {
return this.emit('user:typing', { conversationId, isTyping });
}

joinConversation(conversationId) {
if (!this.socket?.connected) {
    console.warn(`⚠️ Cannot join conversation ${conversationId}: Socket not connected`);
    // Try to reconnect
    if (this.token) {
    console.log('🔄 Attempting to reconnect socket...');
    this.connect(this.token).then(() => {
        console.log(`✅ Reconnected, joining conversation ${conversationId}`);
        this.emit('join:conversation', conversationId);
    }).catch(err => {
        console.error('❌ Failed to reconnect:', err.message);
    });
    }
    return false;
}
console.log(`💬 Joining conversation: ${conversationId}`);
return this.emit('join:conversation', conversationId);
}

leaveConversation(conversationId) {
if (!this.socket?.connected) {
    console.warn(`⚠️ Cannot leave conversation ${conversationId}: Socket not connected`);
    return false;
}
console.log(`💬 Leaving conversation: ${conversationId}`);
return this.emit('leave:conversation', conversationId);
}

sendHeartbeat() {
if (this.socket?.connected) {
    this.emit('heartbeat', { timestamp: Date.now() });
}
}

getSocketId() {
return this.socket?.id;
}

isConnected() {
return this.socket?.connected || false;
}

waitForConnection() {
return new Promise((resolve, reject) => {
    if (this.socket?.connected) {
    resolve(this.socket);
    return;
    }

    const timeout = setTimeout(() => {
    reject(new Error('Socket connection timeout'));
    }, 10000);

    const connectHandler = () => {
    clearTimeout(timeout);
    resolve(this.socket);
    };

    this.socket?.once('connect', connectHandler);
    
    // If socket doesn't exist yet, create it
    if (!this.socket && this.token) {
    this.connect(this.token).then(resolve).catch(reject);
    }
});
}
}

// Create singleton instance
const socketService = new SocketService();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
window.socketService = socketService;
}

export default socketService;