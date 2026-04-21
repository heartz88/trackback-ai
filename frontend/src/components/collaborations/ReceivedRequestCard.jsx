import { Link } from 'react-router-dom';

const toSlug = (title) => title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

export default function ReceivedRequestCard({ req, onApprove, onDecline, index = 0 }) {
return (
<div className={`glass-panel p-5 rounded-2xl border-l-4 border-l-yellow-500 animate-slide-up stagger-${Math.min(index + 1, 8)}`}>
    <div className="flex items-start space-x-4 mb-4">
    <Link to={`/profile/${req.collaborator_name}`} className="flex-shrink-0">
        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {req.collaborator_name?.[0]?.toUpperCase() || '?'}
        </div>
    </Link>
    <div className="flex-1 min-w-0">
        <Link to={`/profile/${req.collaborator_name}`} className="text-[var(--text-primary)] font-semibold hover:text-primary-400">
        {req.collaborator_name}
        </Link>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
        wants to collaborate on{' '}
        <Link to={`/tracks/${toSlug(req.track_title)}`} className="text-primary-400 hover:text-primary-300 font-medium">
            "{req.track_title}"
        </Link>
        </p>
    </div>
    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium flex-shrink-0">
        Pending
    </span>
    </div>

    {req.message && (
    <p className="text-[var(--text-secondary)] text-sm mb-4 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] italic">
        "{req.message}"
    </p>
    )}

    <div className="flex items-center gap-2 mb-4 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
    <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
    <Link to={`/tracks/${toSlug(req.track_title)}`} className="text-sm text-primary-400 hover:text-primary-300 truncate flex-1">
        View track: "{req.track_title}"
    </Link>
    </div>

    <div className="flex gap-2">
    <button onClick={onApprove}
        className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-[box-shadow,border-color] text-sm">
        ✓ Approve
    </button>
    <Link to={`/messages/${req.collaborator_name}`}
        className="px-4 py-2.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-xl transition-[box-shadow,border-color] text-sm border border-[var(--border-color)] flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Message
    </Link>
    <button onClick={onDecline}
        className="px-4 py-2.5 bg-[var(--bg-tertiary)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-secondary)] font-medium rounded-xl transition-[box-shadow,border-color] text-sm border border-[var(--border-color)]">
        Decline
    </button>
    </div>
</div>
);
}