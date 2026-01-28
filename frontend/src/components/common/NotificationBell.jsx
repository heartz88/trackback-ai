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
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" />
        </svg>
        </div>
    );
    case 'message':
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        </div>
    );
    default:
    return (
        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
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
    return '/collaborations';
    case 'message':
    return `/messages/${notification.data.conversationId}`;
    default:
    return '#';
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
                    {notification.type === 'collaboration_request'
                    ? 'New Collaboration Request'
                    : 'New Message'}
                </p>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                    {notification.data?.message || notification.data?.content || 'New notification'}
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
            to="/messages"
            onClick={() => setIsOpen(false)}
            className="block text-center text-sm text-primary-400 hover:text-primary-300 font-medium py-2"
            >
            View all notifications
            </Link>
        </div>
        )}
    </div>
    )}
</div>
);
}

export default NotificationBell;