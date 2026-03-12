export default function ChatHeader({ 
conversation, 
currentUser,
onlineUsers,
onBack,
onNewChat 
}) {
const otherUser = conversation?.participants?.find(p => p.id !== currentUser?.id);
const isOnline = onlineUsers.has(otherUser?.id);

return (
<div className="messages-chat-header p-4 border-b border-[var(--border-color)]">
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
        <button
        onClick={onBack}
        className="lg:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        >
        <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        </button>
        <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
        {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse"></div>
        )}
        </div>
        <div>
        <h3 className="font-semibold text-[var(--text-primary)]">
            {otherUser?.username || 'Unknown User'}
        </h3>
        <p className="text-sm text-[var(--text-tertiary)]">
            {isOnline ? 'Online' : 'Offline'}
        </p>
        </div>
    </div>
    <button
        onClick={onNewChat}
        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        title="New conversation"
    >
        <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    </button>
    </div>
</div>
);
}