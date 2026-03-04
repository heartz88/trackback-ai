import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

function NotificationBell() {
const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useSocket();
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef(null);

useEffect(() => {
const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
    setIsOpen(false);
    }
};

document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const formatTime = (timestamp) => {
const now = new Date();
const notificationTime = new Date(timestamp);
const diffMs = now - notificationTime;
const diffMins = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins}m ago`;
if (diffHours < 24) return `${diffHours}h ago`;
if (diffDays < 7) return `${diffDays}d ago`;
return notificationTime.toLocaleDateString();
};

const getNotificationIcon = (type) => {
switch (type) {
    case 'collaboration_request':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" />
        </svg>
        </div>
    );
    case 'collaboration_response':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        </div>
    );
    case 'submission':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        </div>
    );
    case 'vote':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        </div>
    );
    case 'comment':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        </div>
    );
    case 'message':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        </div>
    );
    default:
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        </div>
    );
}
};

const getNotificationLink = (notification) => {
switch (notification.type) {
    case 'collaboration_request':
    case 'collaboration_response':
    return '/collaborations';
    case 'submission':
    case 'vote':
    case 'comment':
    return notification.data?.track_id
        ? `/tracks/${notification.data.track_id}/submissions`
        : '/collaborations';
    case 'message':
    return notification.data?.conversationId
        ? `/messages/${notification.data.conversationId}`
        : '/messages';
    default:
    return '/collaborations';
}
};

return (
<div className="relative" ref={dropdownRef}>
    <button
    onClick={() => setIsOpen(!isOpen)}
    className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
        {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    )}
    </button>

    {isOpen && (
    <div className="absolute right-0 mt-2 w-96 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
            <div className="flex gap-2">
            {notifications.length > 0 && (
                <>
                <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                    Mark all as read
                </button>
                <button
                    onClick={clearNotifications}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                    Clear all
                </button>
                </>
            )}
            </div>
        </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
            <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[var(--text-secondary)]">No notifications</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">You're all caught up!</p>
            </div>
        ) : (
            notifications.map((notification) => (
            <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                onClick={() => {
                markAsRead(notification.id);
                setIsOpen(false);
                }}
                className={`flex items-start gap-3 p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors ${notification.read ? 'opacity-75' : ''
                }`}
            >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] font-medium mb-1">
                    {notification.type === 'collaboration_request' && '🤝 New Collaboration Request'}
                    {notification.type === 'collaboration_response' && (
                    notification.data?.status === 'approved' ? '✅ Collaboration Approved' : '❌ Collaboration Declined'
                    )}
                    {notification.type === 'submission' && '🎵 New Submission'}
                    {notification.type === 'vote' && '❤️ Someone Liked Your Submission'}
                    {notification.type === 'comment' && '💬 New Comment'}
                    {notification.type === 'message' && '💬 New Message'}
                    {!['collaboration_request','collaboration_response','submission','vote','comment','message'].includes(notification.type) && 'Notification'}
                </p>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                    {notification.data?.message ||
                    notification.data?.content ||
                    notification.data?.text ||
                    'Tap to view'}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--text-tertiary)]">
                    {formatTime(notification.timestamp)}
                    </span>
                    {!notification.read && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    )}
                </div>
                </div>
            </Link>
            ))
        )}
        </div>

        {notifications.length > 0 && (
        <div className="p-3 border-t border-[var(--border-color)]">
            <Link
            to="/collaborations"
            onClick={() => setIsOpen(false)}
            className="block text-center text-sm text-primary-400 hover:text-primary-300 font-medium py-2"
            >
            View all activity
            </Link>
        </div>
        )}
    </div>
    )}
</div>
);
}

export default NotificationBell;