import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

import ChatHeader from '../components/messages/ChatHeader';
import ConnectionStatus from '../components/messages/ConnectionStatus';
import ConversationList from '../components/messages/ConversationList';
import EmptyChatState from '../components/messages/EmptyChatState';
import MessageInput from '../components/messages/MessageInput';
import MessagesLoading from '../components/messages/MessagesLoading';
import MessageThread from '../components/messages/MessageThread';
import UserSearch from '../components/messages/UserSearch';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// The backend already strips the current user out of participants[], so
// participants[0] IS the other user. But we also handle the case where
// the full list is returned (includes current user) just to be safe.
function getOtherUser(conversation, currentUserId) {
  if (!conversation?.participants?.length) return null;
  const other = conversation.participants.find(p => p.id !== currentUserId);
  // If find returns undefined it means all participants have a different id
  // (i.e. current user was already filtered out server-side), so just use [0]
  return other ?? conversation.participants[0];
}

function MessagesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, onlineUsers, connectionError, reconnect } = useSocket();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const {
    conversations, selectedConversation, setSelectedConversation,
    loadingConversations, startingConversation,
    hasJoinedConversation, selectConversation,
    fetchConversations, startConversation,
  } = useConversations();

  const {
    messages, loading, newMessage, typingUsers,
    deletingMessageId, hoveredMessageId, setHoveredMessageId,
    messagesEndRef, messagesContainerRef,
    handleScroll, handleSendMessage, handleTyping, handleDeleteMessage,
  } = useMessages(selectedConversation, hasJoinedConversation);

  // Normalise onlineUsers to a Set
  const currentOnlineUsers = (() => {
    if (onlineUsers instanceof Set) return onlineUsers;
    if (Array.isArray(onlineUsers)) return new Set(onlineUsers.map(u => u.id || u));
    if (onlineUsers && typeof onlineUsers === 'object') return new Set(Object.keys(onlineUsers).map(Number));
    return new Set();
  })();

  // The other participant in the selected conversation
  const otherUser = getOtherUser(selectedConversation, user?.id);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    api.get('/messages/users/search', { params: { search: '' } })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {});
  }, []);

  const filteredUsers = users.filter(u =>
    u.id !== user?.id &&
    (u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleReconnect = useCallback(async () => {
    await reconnect();
  }, [reconnect]);

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
              onClick={() => setShowUserSearch(s => !s)}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/20"
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
              onStartConversation={(id) => {
                startConversation(id, toast);
                setShowUserSearch(false);
              }}
              isConnected={isConnected}
              startingConversation={startingConversation}
              onlineUsers={currentOnlineUsers}
            />
          </div>
        )}

        {/* Main layout */}
        <div className="flex-1 min-h-0 flex gap-4">

          {/* Sidebar */}
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
                onSelectConversation={selectConversation}
                currentUser={user}
                onlineUsers={currentOnlineUsers}
                formatTime={formatTime}
              />
            </div>
          </div>

          {/* Chat panel */}
          <div className={`flex-1 min-w-0 ${!selectedConversation ? 'hidden lg:block' : 'block'}`}>
            {selectedConversation ? (
              <div className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col">
                <ChatHeader
                  conversation={selectedConversation}
                  currentUser={user}
                  onlineUsers={currentOnlineUsers}
                  onBack={() => { setSelectedConversation(null); navigate('/messages'); }}
                  onNewChat={() => setShowUserSearch(true)}
                />
                <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
                  <MessageThread
                    messages={messages}
                    currentUser={user}
                    typingUsers={typingUsers}
                    otherUser={otherUser}
                    hoveredMessageId={hoveredMessageId}
                    setHoveredMessageId={setHoveredMessageId}
                    onDeleteMessage={(id) => handleDeleteMessage(id, toast, confirm)}
                    deletingMessageId={deletingMessageId}
                    formatTime={formatTime}
                    messagesEndRef={messagesEndRef}
                  />
                </div>
                <MessageInput
                  value={newMessage}
                  onChange={handleTyping}
                  onSubmit={(e) => handleSendMessage(e, toast)}
                  isConnected={isConnected}
                  placeholder="Type your message..."
                />
              </div>
            ) : (
              <div className="h-full glass-panel rounded-2xl overflow-hidden">
                <EmptyChatState onStartNewChat={() => setShowUserSearch(true)} isConnected={isConnected} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;