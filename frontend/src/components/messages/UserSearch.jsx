import Avatar from '../common/Avatar';

const UserSearchItem = ({ user, isOnline, onSelect, disabled }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    onClick={() => !disabled && onSelect()}
  >
    <div className="relative">
      <Avatar user={user} size={40} />
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-500 rounded-full border border-[var(--bg-primary)]"></div>
      )}
    </div>
    <div className="flex-1">
      <p className="font-medium text-[var(--text-primary)]">{user.username || 'Unknown User'}</p>
    </div>
    <button
      className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-[box-shadow,border-color] ${
        disabled
          ? 'bg-gray-600 cursor-not-allowed opacity-50'
          : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400'
      }`}
      disabled={disabled}
    >
      Message
    </button>
  </div>
);

export default function UserSearch({ 
  searchQuery, 
  setSearchQuery, 
  users, 
  filteredUsers, 
  onStartConversation,
  isConnected,
  startingConversation,
  onlineUsers 
}) {
  const isUserOnline = (userId) => {
    if (onlineUsers instanceof Set) return onlineUsers.has(userId);
    if (Array.isArray(onlineUsers)) return onlineUsers.some(u => u.id === userId);
    return false;
  };

  return (
    <div className="messages-search-panel mb-6 glass-panel rounded-2xl p-6 animate-slide-down">
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
        Start New Conversation
      </h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-[box-shadow,border-color]"
          autoFocus
          disabled={startingConversation || !isConnected}
        />
      </div>
      <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">
              {searchQuery ? 'No users found' : 'Start typing to search users'}
            </p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <UserSearchItem
              key={user.id}
              user={user}
              isOnline={isUserOnline(user.id)}
              onSelect={() => onStartConversation(user.id)}
              disabled={startingConversation || !isConnected}
            />
          ))
        )}
      </div>
    </div>
  );
}