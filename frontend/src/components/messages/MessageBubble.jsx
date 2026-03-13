import { useState } from 'react';

const TrashIcon = () => (
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg>
);

const Spinner = () => (
<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
formatTime
}) {
const [showDelete, setShowDelete] = useState(false);

return (
<div
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    onMouseEnter={() => setShowDelete(true)}
    onMouseLeave={() => setShowDelete(false)}
>
    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    {!isOwn && (
        <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
        {message.senderName?.[0]?.toUpperCase() || '?'}
        </div>
    )}
    
    <div className="relative flex items-end gap-1">
        <div
        className={`px-3 py-2 break-words ${
            isOwn
            ? 'bg-primary-500 text-white rounded-2xl rounded-br-none'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl rounded-bl-none border border-[var(--border-color)]'
        }`}
        >
        <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        
        {/* Delete button - always visible for own messages */}
        {isOwn && (
        <button
            onClick={() => onDelete(message.id)}
            disabled={isDeleting}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
            showDelete 
                ? 'bg-red-500/20 text-red-400 opacity-100' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] opacity-70'
            } hover:bg-red-500/30 hover:text-red-400`}
            title="Delete message"
        >
            {isDeleting ? <Spinner /> : <TrashIcon />}
        </button>
        )}
    </div>
    </div>
    
    {showTime && (
    <div className={`text-[10px] text-[var(--text-tertiary)] mt-1 ${isOwn ? 'text-right' : 'text-left'} ml-2`}>
        {formatTime(message.timestamp)}
        {message.read && isOwn && (
        <span className="ml-1 text-primary-400 text-xs">✓✓</span>
        )}
    </div>
    )}
</div>
);
}