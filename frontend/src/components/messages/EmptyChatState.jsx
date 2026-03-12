export default function EmptyChatState({ onStartNewChat, isConnected }) {
return (
<div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-24 h-24 bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-full flex items-center justify-center mb-6">
    <svg className="w-12 h-12 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    </div>
    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Select a conversation</h3>
    <p className="text-[var(--text-secondary)] max-w-md mb-6">
    Choose an existing conversation from the sidebar or start a new one
    </p>
    <button
    onClick={onStartNewChat}
    className={`px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg ${
        !isConnected
        ? 'bg-gray-600 cursor-not-allowed shadow-none'
        : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/20'
    }`}
    disabled={!isConnected}
    >
    Start New Chat
    </button>
    {!isConnected && (
    <p className="mt-3 text-sm text-amber-500">
        ⚠️ Please wait for connection to start new chats
    </p>
    )}
</div>
);
}