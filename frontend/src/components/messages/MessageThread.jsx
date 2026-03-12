import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function MessageThread({ 
messages, 
currentUser, 
typingUsers, 
otherUser,
hoveredMessageId,
setHoveredMessageId,
onDeleteMessage,
deletingMessageId 
}) {
const messagesEndRef = useRef(null);
const containerRef = useRef(null);

useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

const formatTime = (timestamp) => {
if (!timestamp) return '';
const date = new Date(timestamp);
return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

if (messages.length === 0) {
return (
    <div className="messages-area flex-1 overflow-y-auto p-4 min-h-0 flex items-center justify-center">
    <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        </div>
        <p className="text-[var(--text-secondary)]">No messages yet</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Send a message to start the conversation</p>
    </div>
    </div>
);
}

return (
<div ref={containerRef} className="messages-area flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
    {messages.map((message, index) => {
    const isOwn = message.senderId === currentUser?.id;
    const showTime = index === messages.length - 1 ||
        messages[index + 1]?.senderId !== message.senderId ||
        new Date(messages[index + 1]?.timestamp) - new Date(message.timestamp) > 5 * 60 * 1000;

    return (
        <MessageBubble
        key={message.id}
        message={message}
        isOwn={isOwn}
        showTime={showTime}
        onDelete={onDeleteMessage}
        isDeleting={deletingMessageId === message.id}
        isHovered={hoveredMessageId === message.id}
        onHover={setHoveredMessageId}
        formatTime={formatTime}
        />
    );
    })}

    <TypingIndicator 
    typingUsers={typingUsers} 
    currentUserId={currentUser?.id}
    otherUser={otherUser}
    />

    <div ref={messagesEndRef} />
</div>
);
}