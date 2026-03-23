import Avatar from '../common/Avatar';

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
    className={`p-3 rounded-xl cursor-pointer transition-[box-shadow,border-color] duration-200 ${
    isSelected
        ? 'bg-primary-500/10 border border-primary-500/30'
        : 'hover:bg-[var(--bg-tertiary)]'
    }`}
    onClick={() => onSelect(conversation)}
>
    <div className="flex items-center gap-3">
    <div className="relative">
        <Avatar user={otherUser} size={44} />
        {isOnline && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
        )}
    </div>
    <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
        <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate">
            {otherUser?.username || 'Unknown User'}
        </h4>
        {lastMessage && (
            <span className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap ml-2">
            {formatTime(lastMessage.timestamp)}
            </span>
        )}
        </div>
        {lastMessage ? (
        <p className={`text-xs truncate ${hasUnread ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
            {lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
            {lastMessage.content}
        </p>
        ) : (
        <p className="text-xs text-[var(--text-tertiary)] italic">No messages yet</p>
        )}
        {hasUnread && (
        <div className="mt-1">
            <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
        </div>
        )}
    </div>
    </div>
</div>
);
}