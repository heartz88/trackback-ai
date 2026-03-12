export default function RankBadge({ rank }) {
const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

if (medals[rank]) {
return <span className="text-2xl">{medals[rank]}</span>;
}

return (
<div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
    #{rank}
</div>
);
}