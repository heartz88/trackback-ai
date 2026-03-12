
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

const formatLastActive = (d) => {
if (!d) return 'Unknown';
const s = Math.floor((Date.now() - new Date(d)) / 1000);
if (s < 60) return 'Online now';
if (s < 3600) return `${Math.floor(s / 60)}m ago`;
if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
return new Date(d).toLocaleDateString();
};

export default function ProfileMeta({ created_at, last_active, looking_for_collab }) {
return (
<div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] flex-wrap">
    <span className="flex items-center gap-1">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    Joined {formatDate(created_at)}
    </span>
    <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full" />
    <span>Last active {formatLastActive(last_active)}</span>
    {looking_for_collab && (
    <>
        <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full" />
        <span className="text-green-400 font-medium flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Open to collabs
        </span>
    </>
    )}
</div>
);
}