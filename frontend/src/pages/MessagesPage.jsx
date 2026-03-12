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
      return new Set(Object.keys(onlineUsers).map(Number));
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
      const response = await api.get('/messages/conversations');
      const conversationsData = response.data.conversations || [];
      setConversations(conversationsData);

      // If URL has conversationId, select that conversation
      if (conversationId) {
        const conv = conversationsData.find(c => c.id.toString() === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
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

  // Fetch messages when selectedConversation changes
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/messages/conversations/${selectedConversation.id}/messages`);
        const messagesData = response.data.messages || [];
        setMessages(messagesData);

        // Mark as read
        await api.post(`/messages/conversations/${selectedConversation.id}/read`);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
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

      if (latest.type === 'message' && selectedConversation) {
        if (latest.data.conversationId?.toString() === selectedConversation.id.toString()) {
          setMessages(prev => {
            if (prev.some(m => m.id === latest.data.id)) return prev;
            return [...prev, latest.data];
          });
        }
      }
      lastNotificationCount.current = notifications.length;
    }
  }, [notifications, selectedConversation?.id]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (selectedConversation && message.conversationId.toString() === selectedConversation.id.toString()) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    const handleUserTyping = (data) => {
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
  }, [selectedConversation?.id, joinConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !isConnected) {
      if (!isConnected) {
        toast.error('Please wait for connection to establish before sending messages.');
      }
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    const success = sendMessage(selectedConversation.id, messageContent);
    if (!success) {
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

      const parsedRecipientId = parseInt(recipientId);
      if (isNaN(parsedRecipientId)) {
        toast.error('Invalid user ID');
        return;
      }

      if (parsedRecipientId === user.id) {
        toast.error('You cannot start a conversation with yourself');
        return;
      }

      const response = await api.post('/messages/conversations', {
        participantId: parsedRecipientId
      });

      const newConversation = response.data.conversation;

      setConversations(prev => {
        const exists = prev.some(c => c.id === newConversation.id);
        if (exists) {
          return prev.map(c => c.id === newConversation.id ? newConversation : c);
        }
        return [newConversation, ...prev];
      });
      
      setSelectedConversation(newConversation);
      setShowUserSearch(false);
      hasJoinedConversation.current = false;

      navigate(`/messages/${newConversation.id}`);

    } catch (err) {
      let errorMessage = 'Failed to start conversation';

      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      }

      if (err.response?.status === 400) {
        if (errorMessage.includes('already exists') || errorMessage.includes('Unique constraint')) {
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
      }

      toast.error(errorMessage || 'Failed to start conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  const handleReconnect = async () => {
    const success = await reconnect();
    if (!success) {
      console.error('Reconnection failed');
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
    return <MessagesLoading />;
  }

  return (
    <div className="messages-page-root min-h-screen bg-[var(--bg-primary)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Messages</h1>
          <ConnectionStatus
            isConnected={isConnected}
            connectionError={connectionError}
            onlineUsersCount={currentOnlineUsers.size}
            onReconnect={handleReconnect}
          />
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg"
          >
            {showUserSearch ? 'Cancel' : 'New Message'}
          </button>
        </div>

        {showUserSearch && (
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
        )}

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Left sidebar */}
          <div className={`lg:w-1/3 ${!selectedConversation ? 'block' : 'hidden lg:block'}`}>
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

          {/* Right side - Messages */}
          <div className={`flex-1 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            {selectedConversation ? (
              <div className="flex flex-col h-full w-full">
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
                />
                <div ref={messagesEndRef} />

                <MessageInput
                  value={newMessage}
                  onChange={handleTyping}
                  onSubmit={handleSendMessage}
                  isConnected={isConnected}
                  placeholder="Type your message..."
                />
              </div>
            ) : (
              <EmptyChatState
                onStartNewChat={() => setShowUserSearch(true)}
                isConnected={isConnected}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;