import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import socketService from '../services/socket';

// Import components
import ChatHeader from '../components/messages/ChatHeader';
import ConnectionStatus from '../components/messages/ConnectionStatus';
import ConversationList from '../components/messages/ConversationList';
import EmptyChatState from '../components/messages/EmptyChatState';
import MessageInput from '../components/messages/MessageInput';
import MessagesLoading from '../components/messages/MessagesLoading';
import MessageThread from '../components/messages/MessageThread';
import UserSearch from '../components/messages/UserSearch';

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
  
  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wasAtBottomRef = useRef(true);
  const hasJoinedConversation = useRef(false);
  const lastNotificationCount = useRef(0);
  const pendingMessagesRef = useRef(new Set()); // Track pending message IDs
  
  // States
  const [startingConversation, setStartingConversation] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  // Convert onlineUsers to Set
  const onlineUsersSet = useCallback(() => {
    if (onlineUsers instanceof Set) return onlineUsers;
    if (Array.isArray(onlineUsers)) return new Set(onlineUsers.map(u => u.id || u));
    if (typeof onlineUsers === 'object' && onlineUsers !== null) {
      return new Set(Object.keys(onlineUsers).map(Number));
    }
    return new Set();
  }, [onlineUsers]);

  const currentOnlineUsers = onlineUsersSet();

  // Check if user is near bottom
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Track scroll position
  const handleScroll = useCallback(() => {
    wasAtBottomRef.current = isNearBottom();
  }, []);

  // Smart scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'nearest' });
    }
  }, []);

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    const ok = await confirm({
      title: 'Delete message?',
      message: 'This will be permanently removed.',
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
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const response = await api.get('/messages/conversations');
      const conversationsData = response.data.conversations || [];
      setConversations(conversationsData);

      if (conversationId) {
        const conv = conversationsData.find(c => c.id.toString() === conversationId);
        if (conv) setSelectedConversation(conv);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [conversationId]);

  // Join/leave conversation room
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

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/messages/conversations/${selectedConversation.id}/messages`);
        setMessages(response.data.messages || []);
        await api.post(`/messages/conversations/${selectedConversation.id}/read`);
        
        setTimeout(() => scrollToBottom('auto'), 100);
      } catch (err) {
        if (err.response?.status === 403) {
          setSelectedConversation(null);
          navigate('/messages');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation?.id, navigate, scrollToBottom]);

  // Fetch users for search
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/messages/users/search', { params: { search: '' } });
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [fetchConversations, fetchUsers]);

  // Watch for new messages via notifications
  useEffect(() => {
    if (notifications.length > lastNotificationCount.current) {
      const latest = notifications[0];
      if (latest.type === 'message' && selectedConversation &&
          latest.data.conversationId?.toString() === selectedConversation.id.toString()) {
        
        // Check if this message is already in our list (to prevent duplicates)
        setMessages(prev => {
          if (prev.some(m => m.id === latest.data.id)) return prev;
          return [...prev, latest.data];
        });
        
        if (wasAtBottomRef.current) setTimeout(() => scrollToBottom(), 100);
      }
      lastNotificationCount.current = notifications.length;
    }
  }, [notifications, selectedConversation?.id, scrollToBottom]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (selectedConversation && message.conversationId.toString() === selectedConversation.id.toString()) {
        // Check if this is a temporary message we already added optimistically
        setMessages(prev => {
          // If message has an ID and it's not a temp ID, replace any temp message with same content
          if (!message.temp) {
            // Remove any temp messages with the same content from same sender
            const filtered = prev.filter(m => 
              !(m.temp && m.content === message.content && m.senderId === message.senderId)
            );
            // Add the real message if not already present
            if (!filtered.some(m => m.id === message.id)) {
              return [...filtered, message];
            }
            return filtered;
          }
          
          // For non-temp messages, just add if not duplicate
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
          return prev;
        });
        
        if (wasAtBottomRef.current) setTimeout(() => scrollToBottom(), 100);
      }
    };

    const handleUserTyping = (data) => {
      if (selectedConversation && data.conversationId?.toString() === selectedConversation.id.toString()) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
          }, 3000);
        }
      }
    };

    const handleSocketConnected = () => {
      if (selectedConversation && !hasJoinedConversation.current) {
        joinConversation(selectedConversation.id);
        hasJoinedConversation.current = true;
      }
    };

    const unsubscribeNewMessage = socketService.on('message:new', handleNewMessage);
    const unsubscribeUserTyping = socketService.on('user:typing', handleUserTyping);
    const unsubscribeSocketConnected = socketService.on('socket:connected', handleSocketConnected);

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeUserTyping?.();
      unsubscribeSocketConnected?.();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConversation?.id, joinConversation, scrollToBottom]);

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !isConnected) {
      if (!isConnected) toast.error('Please wait for connection.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Generate a temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Optimistic update with temp ID
    const tempMessage = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: user.id,
      senderName: user.username,
      content: messageContent,
      timestamp: new Date().toISOString(),
      read: false,
      temp: true // Mark as temporary
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(), 50);

    // Send actual message
    const success = sendMessage(selectedConversation.id, messageContent);
    if (!success) {
      // Remove temp message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Failed to send message.');
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

      const parsedRecipientId = parseInt(recipientId);
      if (isNaN(parsedRecipientId) || parsedRecipientId === user.id) {
        toast.error(isNaN(parsedRecipientId) ? 'Invalid user ID' : 'Cannot start conversation with yourself');
        return;
      }

      const response = await api.post('/messages/conversations', {
        participantId: parsedRecipientId
      });

      const newConversation = response.data.conversation;

      setConversations(prev => {
        const exists = prev.some(c => c.id === newConversation.id);
        if (exists) return prev.map(c => c.id === newConversation.id ? newConversation : c);
        return [newConversation, ...prev];
      });
      
      setSelectedConversation(newConversation);
      setShowUserSearch(false);
      hasJoinedConversation.current = false;
      navigate(`/messages/${newConversation.id}`);

    } catch (err) {
      let errorMessage = 'Failed to start conversation';
      if (err.response?.data?.error?.message) errorMessage = err.response.data.error.message;

      if (err.response?.status === 400 && errorMessage.includes('already exists')) {
        const existingConv = conversations.find(c =>
          c.participants?.some(p => p.id === parseInt(recipientId))
        );
        if (existingConv) {
          setSelectedConversation(existingConv);
          hasJoinedConversation.current = false;
          navigate(`/messages/${existingConv.id}`);
          return;
        }
      }
      toast.error(errorMessage);
    } finally {
      setStartingConversation(false);
    }
  };

  const handleReconnect = async () => {
    const success = await reconnect();
    if (!success) console.error('Reconnection failed');
  };

  // Helper functions
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = (conversation) => {
    return conversation?.participants?.find(p => p.id !== user.id);
  };

  const filteredUsers = users.filter(u =>
    u.id !== user.id &&
    (u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loadingConversations) return <MessagesLoading />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto h-screen flex flex-col py-4 px-4">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Messages</h1>
          <div className="flex items-center justify-between">
            <ConnectionStatus
              isConnected={isConnected}
              connectionError={connectionError}
              onlineUsersCount={currentOnlineUsers.size}
              onReconnect={handleReconnect}
            />
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
            >
              {showUserSearch ? 'Cancel' : '+ New Message'}
            </button>
          </div>
        </div>

        {/* User Search */}
        {showUserSearch && (
          <div className="mb-4 flex-shrink-0">
            <UserSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              users={users}
              filteredUsers={filteredUsers}
              onStartConversation={handleStartConversation}
              isConnected={isConnected}
              startingConversation={startingConversation}
              onlineUsers={currentOnlineUsers}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Left sidebar */}
          <div className={`w-80 flex-shrink-0 ${!selectedConversation ? 'block' : 'hidden lg:block'}`}>
            <div className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-[var(--border-color)]">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={(conv) => {
                  setSelectedConversation(conv);
                  navigate(`/messages/${conv.id}`);
                }}
                currentUser={user}
                onlineUsers={currentOnlineUsers}
                formatTime={formatTime}
              />
            </div>
          </div>

          {/* Right side - Messages */}
          <div className={`flex-1 min-w-0 ${!selectedConversation ? 'hidden lg:block' : 'block'}`}>
            {selectedConversation ? (
              <div className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col">
                <ChatHeader
                  conversation={selectedConversation}
                  currentUser={user}
                  onlineUsers={currentOnlineUsers}
                  onBack={() => {
                    setSelectedConversation(null);
                    navigate('/messages');
                  }}
                  onNewChat={() => setShowUserSearch(true)}
                />

                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto"
                >
                  <MessageThread
                    messages={messages}
                    currentUser={user}
                    typingUsers={typingUsers}
                    otherUser={getOtherParticipant(selectedConversation)}
                    hoveredMessageId={hoveredMessageId}
                    setHoveredMessageId={setHoveredMessageId}
                    onDeleteMessage={handleDeleteMessage}
                    deletingMessageId={deletingMessageId}
                    formatTime={formatTime}
                    messagesEndRef={messagesEndRef}
                  />
                </div>

                <MessageInput
                  value={newMessage}
                  onChange={handleTyping}
                  onSubmit={handleSendMessage}
                  isConnected={isConnected}
                  placeholder="Type your message..."
                />
              </div>
            ) : (
              <div className="h-full glass-panel rounded-2xl overflow-hidden">
                <EmptyChatState
                  onStartNewChat={() => setShowUserSearch(true)}
                  isConnected={isConnected}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;