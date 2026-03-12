const TABS = ['Featured', 'Recently Completed', 'Most Voted'];

export default function CommunityTabs({ activeTab, setActiveTab }) {
return (
<div className="flex gap-2 p-1 bg-[var(--surface-1)] border border-[var(--border-color)] rounded-xl mb-6">
    {TABS.map((tab, index) => (
    <button
        key={tab}
        onClick={() => setActiveTab(index)}
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
        activeTab === index
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
        {tab}
    </button>
    ))}
</div>
);
}