import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const TYPE_CONFIG = {
collaboration_request:  { label: 'Collaboration Request',  bg: 'from-primary-500 to-primary-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 1a6 6 0 01-9 5.197" /> },
collaboration_response: { label: 'Collaboration Response', bg: 'from-emerald-500 to-teal-500',       icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
submission:             { label: 'New Submission',         bg: 'from-violet-500 to-purple-600',      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /> },
vote:                   { label: 'New Like',               bg: 'from-rose-500 to-pink-500',          heart: true },
comment:                { label: 'New Comment',            bg: 'from-amber-500 to-orange-500',       icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /> },
message:                { label: 'New Message',            bg: 'from-blue-500 to-cyan-500',          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
};

const LINK_MAP = {
collaboration_request:  '/collaborations',
collaboration_response: '/collaborations',
submission:             '/my-tracks',
vote:                   '/my-tracks',
comment:                '/my-tracks',
message:                '/messages',
};

function NotifIcon({ type }) {
const cfg = TYPE_CONFIG[type] || { bg: 'from-gray-500 to-gray-700' };
return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.bg}`}>
    {cfg.heart
        ? <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{cfg.icon}</svg>
    }
    </div>
);
}

function formatTime(timestamp) {
const now = new Date();
const t = new Date(timestamp);
const diff = Math.floor((now - t) / 1000);
if (diff < 60) return 'Just now';
if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
return t.toLocaleDateString();
}

export default function NotificationsPage() {
const navigate = useNavigate();
const { clearNotifications, markAllAsRead } = useSocket();
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

useEffect(() => {
    api.get('/notifications')
    .then(r => setNotifications(r.data.notifications || []))
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

const markRead = async (id) => {
    try {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
};

const deleteOne = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
};

const markAllRead = async () => {
    try {
    await api.put('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      markAllAsRead(); // also clear socket badge
    } catch {}
};

const clearAll = async () => {
    try {
    await api.delete('/notifications');
    setNotifications([]);
      clearNotifications(); // clear socket state too
    } catch {}
};

const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

const unreadCount = notifications.filter(n => !n.is_read).length;

return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
    <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            {unreadCount > 0 && (
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{unreadCount} unread</p>
            )}
        </div>
        <div className="flex gap-2">
            {unreadCount > 0 && (
            <button
                onClick={markAllRead}
                className="px-3 py-1.5 text-sm text-primary-400 bg-primary-500/10 border border-primary-500/30 rounded-lg font-medium"
            >
                Mark all read
            </button>
            )}
            {notifications.length > 0 && (
            <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg font-medium"
            >
                Clear all
            </button>
            )}
        </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
        {[
            { key: 'all',    label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
        ].map(({ key, label }) => (
            <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                filter === key
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)]'
            }`}
            >
            {label}
            </button>
        ))}
        </div>

        {/* List */}
        <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
            <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <svg className="w-14 h-14 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="font-semibold text-[var(--text-secondary)] mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
            {filter === 'unread' ? 'Switch to All to see past notifications' : 'New activity will appear here'}
            </p>
            </div>
        ) : (
            <div>
            {displayed.map((n, i) => (
                <Link
                key={n.id}
                to={LINK_MAP[n.type] || '/collaborations'}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-3 p-4 active:bg-[var(--bg-tertiary)] ${
                i < displayed.length - 1 ? 'border-b border-[var(--border-color)]' : ''
                } ${n.is_read ? 'opacity-60' : ''}`}
            >
                <NotifIcon type={n.type} />

                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {TYPE_CONFIG[n.type]?.label || 'Notification'}
                    </p>
                    {!n.is_read && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.content}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatTime(n.created_at)}</p>
                </div>

                  {/* Delete button */}
                <button
                onClick={(e) => deleteOne(n.id, e)}
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] flex-shrink-0 mt-0.5"
                title="Delete notification"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </Link>
            ))}
        </div>
        )}
    </div>

    </div>
</div>
);
}