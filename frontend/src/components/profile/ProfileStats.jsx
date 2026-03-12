export default function ProfileStats({ tracksCount, collaborationsCount }) {
return (
<div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
    <div className="text-center group">
    <div className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
        {tracksCount}
    </div>
    <div className="text-xs text-[var(--text-tertiary)]">Tracks</div>
    </div>
    <div className="text-center group">
    <div className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
        {collaborationsCount}
    </div>
    <div className="text-xs text-[var(--text-tertiary)]">Collabs</div>
    </div>
    <div className="text-center group">
    <div className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
        {tracksCount + collaborationsCount}
    </div>
    <div className="text-xs text-[var(--text-tertiary)]">Total</div>
    </div>
</div>
);
}