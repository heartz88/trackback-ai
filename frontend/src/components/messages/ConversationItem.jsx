export default function ConversationItem({ 
conversation, 
otherUser, 
lastMessage, 
isOnline, 
hasUnread, 
isSelected,
onSelect,
formatTime,
currentUser 
}) {
return (
<div
    className={`p-3 rounded-xl mb-1 cursor-pointer transition-all duration-200 ${
    isSelected
        ? 'bg-primary-500/10 border border-primary-500/30'
        : 'hover:bg-[var(--bg-tertiary)]'
    }`}
    onClick={() => onSelect(conversation)}
>
    <div className="flex items-center gap-3">
    <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
        {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse"></div>
        )}
    </div>
    <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-[var(--text-primary)] truncate">
            {otherUser?.username || 'Unknown User'}
        </h4>
        {lastMessage && (
            <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap ml-2">
            {formatTime(lastMessage.timestamp)}
            </span>
        )}
        </div>
        {lastMessage ? (
        <p className={`text-sm truncate ${hasUnread ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
            {lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
            {lastMessage.content}
        </p>
        ) : (
        <p className="text-sm text-[var(--text-tertiary)] italic">No messages yet</p>
        )}
        {hasUnread && (
        <div className="mt-1">
            <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
        </div>
        )}
    </div>
    </div>
</div>
);
}