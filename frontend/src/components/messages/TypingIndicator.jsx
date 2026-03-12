export default function TypingIndicator({ typingUsers, currentUserId, otherUser }) {
  const isTyping = Object.entries(typingUsers).some(([userId, isTyping]) => {
    return isTyping && userId !== currentUserId?.toString() && parseInt(userId) === otherUser?.id;
  });

  if (!isTyping) return null;

  return (
    <div className="flex justify-start mb-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 mr-2 flex-shrink-0 shadow-md">
          {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-none px-4 py-3 border border-[var(--border-color)]">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}