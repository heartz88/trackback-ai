import ConversationItem from './ConversationItem';

export default function ConversationList({
conversations,
selectedConversation,
onSelectConversation,
currentUser,
onlineUsers,
formatTime
}) {
// Backend already strips current user from participants[], so participants[0]
// is the other person. Fall back to find() in case the full list is returned.
const getOtherParticipant = (conversation) => {
const participants = conversation.participants || [];
return participants.find(p => p.id !== currentUser?.id) ?? participants[0];
};

const isUserOnline = (userId) => {
if (onlineUsers instanceof Set) return onlineUsers.has(userId);
if (Array.isArray(onlineUsers)) return onlineUsers.some(u => u.id === userId);
return false;
};

const EmptyConversations = () => (
<div className="text-center py-8">
    <svg className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    <p className="text-[var(--text-tertiary)]">No conversations yet</p>
    <p className="text-xs text-[var(--text-tertiary)] mt-2">Start a new conversation to begin</p>
</div>
);

return (
<div className="flex-1 overflow-y-auto custom-scrollbar">
    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 px-2">
    Conversations
    </h3>
    {conversations.length === 0 ? (
    <EmptyConversations />
    ) : (
    <div className="space-y-1">
        {conversations.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const lastMessage = conversation.lastMessage;
        const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
        const hasUnread = conversation.unreadCount > 0;

        return (
            <ConversationItem
            key={conversation.id}
            conversation={conversation}
            otherUser={otherUser}
            lastMessage={lastMessage}
            isOnline={isOnline}
            hasUnread={hasUnread}
            isSelected={selectedConversation?.id === conversation.id}
            onSelect={onSelectConversation}
            formatTime={formatTime}
            currentUser={currentUser}
            />
        );
        })}
    </div>
    )}
</div>
);
}