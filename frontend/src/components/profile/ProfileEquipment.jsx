export default function ProfileEquipment({ equipment }) {
return (
<div className="mb-4">
    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
    Equipment / Software
    </h3>
    <div className="flex flex-wrap gap-2">
    {equipment.map((item, i) => (
        <span 
        key={i} 
        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm hover:border-primary-500/40 transition-colors"
        >
        {item}
        </span>
    ))}
    </div>
</div>
);
}