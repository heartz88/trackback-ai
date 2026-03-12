
const TrashIcon = () => (
<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg>
);

const Spinner = () => (
<svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
);

export default function MessageBubble({ 
message, 
isOwn, 
showTime, 
onDelete, 
isDeleting,
isHovered,
onHover,
formatTime 
}) {
return (
<div
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}
    onMouseEnter={() => onHover(message.id)}
    onMouseLeave={() => onHover(null)}
>
    <div className={`flex items-end gap-1 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    {!isOwn && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 mr-2 flex-shrink-0 shadow-md">
        {message.senderName?.[0]?.toUpperCase() || '?'}
        </div>
    )}
    <div className="relative">
        <div
        className={`rounded-2xl px-4 py-2.5 break-words ${
            isOwn
            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-none shadow-md'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)]'
        }`}
        >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
        </p>
        </div>
        {showTime && (
        <div className={`text-[10px] text-[var(--text-tertiary)] mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
            {message.read && isOwn && (
            <span className="ml-1 text-primary-400 text-xs">✓✓</span>
            )}
        </div>
        )}
        {isOwn && isHovered && (
        <button
            onClick={() => onDelete(message.id)}
            disabled={isDeleting}
            className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
            title="Delete message"
        >
            {isDeleting ? <Spinner /> : <TrashIcon />}
        </button>
        )}
    </div>
    </div>
</div>
);
}