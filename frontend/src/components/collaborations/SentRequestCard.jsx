import { Link } from 'react-router-dom';

const toSlug = (title) => title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

export default function SentRequestCard({ req, onCancel, index = 0 }) {
return (
<div className={`glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500 animate-slide-up stagger-${Math.min(index + 1, 8)}`}>
    <div className="flex items-start justify-between mb-3">
    <div className="flex-1 min-w-0">
        <Link to={`/tracks/${toSlug(req.track_title)}`} className="text-[var(--text-primary)] font-semibold hover:text-primary-400">
        "{req.track_title}"
        </Link>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
        by{' '}
        <Link to={`/profile/${req.owner_name}`} className="text-primary-400 hover:text-primary-300">{req.owner_name}</Link>
        </p>
    </div>
    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium flex-shrink-0">
        Pending
    </span>
    </div>

    {req.message && (
    <p className="text-[var(--text-secondary)] text-sm p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] italic">
        "{req.message}"
    </p>
    )}

    <div className="flex gap-2 mt-3">
    <Link to={`/tracks/${toSlug(req.track_title)}`}
        className="flex-1 text-center py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-[box-shadow,border-color] border border-[var(--border-color)]">
        View Track
    </Link>
    <Link to={`/messages/${req.owner_name}`}
        className="flex-1 text-center py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-[box-shadow,border-color] border border-[var(--border-color)]">
        Message Owner
    </Link>
    <button onClick={onCancel}
        className="flex-1 text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm transition-[box-shadow,border-color] border border-red-500/30">
        Cancel
    </button>
    </div>
</div>
);
}