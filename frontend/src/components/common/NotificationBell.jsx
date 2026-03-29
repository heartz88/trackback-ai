import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

function NotificationBell() {
const { user } = useAuth();
const { notifications: socketNotifications, unreadCount: socketUnreadCount, markAsRead, markAllAsRead, clearNotifications } = useSocket();
const [isOpen, setIsOpen] = useState(false);
const [dbNotifications, setDbNotifications] = useState([]);
const [dbLoading, setDbLoading] = useState(true);
const dropdownRef = useRef(null);

// Load persisted notifications from DB on mount
useEffect(() => {
if (!user) return;
api.get('/notifications')
.then(r => setDbNotifications(r.data.notifications || []))
.catch(() => {})
.finally(() => setDbLoading(false));
}, [user]);

// Mark DB notification as read
const markDbRead = async (id) => {
try {
await api.put(`/notifications/${id}/read`);
setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
} catch {}
};

const markAllDbRead = async () => {
try {
await api.put('/notifications/mark-all-read');
setDbNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
} catch {}
};

// Close on outside click
useEffect(() => {
const handleClickOutside = (e) => {
if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// Merged unread count: socket (live) + unread DB notifications
const dbUnreadCount = dbNotifications.filter(n => !n.is_read).length;
const totalUnread = socketUnreadCount + dbUnreadCount;

const formatTime = (timestamp) => {
const now = new Date();
const t = new Date(timestamp);
const diffMins = Math.floor((now - t) / 60000);
const diffHours = Math.floor((now - t) / 3600000);
const diffDays = Math.floor((now - t) / 86400000);
if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins}m ago`;
if (diffHours < 24) return `${diffHours}h ago`;
if (diffDays < 7) return `${diffDays}d ago`;
return t.toLocaleDateString();
};

const getIcon = (type) => {
const base = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0';
const icons = {
collaboration_request: { bg: 'bg-gradient-to-br from-primary-500 to-primary-600', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" /> },
collaboration_response: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-500', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
submission: { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /> },
vote: { bg: 'bg-gradient-to-br from-rose-500 to-pink-500', svg: null, heart: true },
comment: { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /> },
message: { bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
};
const cfg = icons[type] || { bg: 'bg-gradient-to-br from-gray-500 to-gray-700', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> };
return (
<div className={`${base} ${cfg.bg}`}>
    {cfg.heart
    ? <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{cfg.svg}</svg>
    }
</div>
);
};

const getTitle = (type, data) => {
switch (type) {
case 'collaboration_request': return 'New Collaboration Request';
case 'collaboration_response': return data?.status === 'approved' ? 'Collaboration Approved' : 'Collaboration Declined';
case 'submission': return '🎵 New Submission';
case 'vote': return 'Someone Liked Your Submission';
case 'comment': return 'New Comment';
case 'message': return 'New Message';
default: return 'Notification';
}
};

const getLink = (type, data) => {
switch (type) {
case 'collaboration_request':
case 'collaboration_response': return '/collaborations';
case 'submission':
case 'vote':
case 'comment': return data?.track_id ? `/tracks/${data.track_id}/submissions` : '/my-tracks';
case 'message': return '/messages';
default: return '/collaborations';
}
};

// DB notification link — content is a string, no structured data
const getDbLink = (type) => {
switch (type) {
case 'collaboration_request':
case 'collaboration_response': return '/collaborations';
case 'submission': return '/my-tracks';
case 'vote':
case 'comment': return '/my-tracks';
case 'message': return '/messages';
default: return '/collaborations';
}
};

const deleteDbNotification = async (id, e) => {
e.preventDefault();
e.stopPropagation();
try {
await api.delete(`/notifications/${id}`);
setDbNotifications(prev => prev.filter(n => n.id !== id));
} catch {}
};

const handleMarkAllRead = () => {
markAllAsRead();     // clears socket notifications
markAllDbRead();     // marks DB notifications read
};

const handleClearAll = async () => {
clearNotifications();
setDbNotifications([]);
try { await api.delete('/notifications'); } catch {}
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
    {totalUnread > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
        {totalUnread > 9 ? '9+' : totalUnread}
    </span>
    )}
</button>

{isOpen && (
    <div className="fixed inset-x-2 top-[72px] z-50 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl overflow-hidden md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-2 md:w-96">
    {/* Header */}
    <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[var(--text-primary)]">
            Notifications {totalUnread > 0 && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
        </h3>
        <div className="flex gap-3">
            {(socketNotifications.length > 0 || dbNotifications.length > 0) && (
            <>
                <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Mark all read
                </button>
                <button onClick={handleClearAll} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                Clear all
                </button>
            </>
            )}
        </div>
        </div>
    </div>

    <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
        {dbLoading ? (
        <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        ) : socketNotifications.length === 0 && dbNotifications.length === 0 ? (
        <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-[var(--text-secondary)] font-medium">All caught up!</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">No notifications yet</p>
        </div>
        ) : (
        <>
            {/* Live socket notifications first */}
            {socketNotifications.map((n) => (
            <Link
                key={`socket-${n.id}`}
                to={getLink(n.type, n.data)}
                onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                className={`flex items-start gap-3 p-3 sm:p-4 border-b border-[var(--border-color)] active:bg-[var(--bg-tertiary)] ${n.read ? 'opacity-60' : ''}`}
            >
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-semibold">{getTitle(n.type, n.data)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                    {n.data?.message || n.data?.content || n.data?.text || 'Tap to view'}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-[var(--text-tertiary)]">{formatTime(n.timestamp)}</span>
                    {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                </div>
                </div>
            </Link>
            ))}

            {/* Persisted DB notifications */}
            {dbNotifications.map((n) => (
            <Link
                key={`db-${n.id}`}
                to={getDbLink(n.type)}
                onClick={() => { markDbRead(n.id); setIsOpen(false); }}
                className={`flex items-start gap-3 p-4 border-b border-[var(--border-color)] active:bg-[var(--bg-tertiary)] ${n.is_read ? 'opacity-60' : ''}`}
            >
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-semibold">{getTitle(n.type, {})}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.content}</p>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-[var(--text-tertiary)]">{formatTime(n.created_at)}</span>
                    <div className="flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                    <button
                        onClick={(e) => deleteDbNotification(n.id, e)}
                        className="text-[var(--text-tertiary)] p-0.5 rounded"
                        title="Delete"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    </div>
                </div>
                </div>
            </Link>
            ))}
        </>
        )}
    </div>

    <div className="p-3 border-t border-[var(--border-color)]">
        <Link
        to="/notifications"
        onClick={() => setIsOpen(false)}
        className="block text-center text-sm text-primary-400 font-medium py-1"
        >
        View all notifications →
        </Link>
    </div>
    </div>
)}
</div>
);
}

export default NotificationBell;