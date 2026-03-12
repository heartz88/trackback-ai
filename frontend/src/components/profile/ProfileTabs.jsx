export default function ProfileTabs({ activeTab, setActiveTab, tracksCount, collaborationsCount }) {
  const tabs = [
    { id: 'tracks', label: 'Tracks', count: tracksCount },
    { id: 'collabs', label: 'Collaborations', count: collaborationsCount }
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          {tab.label}
          <span 
            className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id 
                ? 'bg-white/20 text-white' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}