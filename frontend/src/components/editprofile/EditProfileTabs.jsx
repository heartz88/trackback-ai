const TABS = [
    { id: 'profile',       label: 'Profile',       shortLabel: 'Profile', icon: '👤' },
    { id: 'details',       label: 'Music',          shortLabel: 'Music',   icon: '🎵' },
    { id: 'social',        label: 'Social',         shortLabel: 'Social',  icon: '🔗' },
    { id: 'notifications', label: 'Notifications',  shortLabel: 'Alerts',  icon: '🔔' },
    { id: 'security',      label: 'Security',       shortLabel: 'Security',icon: '🔒' },
];

const TABS_ORDER_IDS = TABS.map(t => t.id);

export { TABS, TABS_ORDER_IDS };

export default function EditProfileTabs({ activeTab, onTabChange }) {
    const idx = TABS_ORDER_IDS.indexOf(activeTab);

    return (
        <div className="relative mb-5">
            <div
                className="absolute bottom-0 h-0.5 rounded-full transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                    left: `${idx * (100 / TABS.length)}%`,
                    width: `${100 / TABS.length}%`,
                    background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
                    boxShadow: '0 0 10px rgba(20,184,166,0.5)',
                }}
            />
            <div className="flex overflow-x-auto scrollbar-none border-b border-[var(--border-color)]/40">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => onTabChange(tab.id)}
                        className="relative flex items-center gap-1.5 px-3 py-2.5 font-medium transition-[box-shadow,border-color] whitespace-nowrap text-sm flex-shrink-0 flex-1 justify-center group"
                        style={{ color: activeTab === tab.id ? '#14b8a6' : 'var(--text-tertiary)' }}>
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg"
                            style={{ background: 'rgba(20,184,166,0.06)' }} />
                        {activeTab === tab.id && (
                            <span className="absolute inset-0 rounded-t-lg" style={{ background: 'rgba(20,184,166,0.08)' }} />
                        )}
                        <span className="relative flex items-center gap-1.5">
                            <span style={{ transform: activeTab === tab.id ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.3s', display: 'inline-block' }}>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}