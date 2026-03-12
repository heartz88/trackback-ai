import { Link } from 'react-router-dom';

export default function EmptyCommunityState({ tab }) {
return (
<div className="text-center py-16">
    <div className="text-5xl mb-4">🎵</div>
    <p className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
    No {tab.toLowerCase()} tracks yet
    </p>
    <p className="text-[var(--text-tertiary)] mb-6">
    Be the first to complete a collaboration and appear here!
    </p>
    <Link to="/discover" className="btn-primary">
    Find a Track to Complete
    </Link>
</div>
);
}