import { useEffect, useRef, useState } from 'react';

const TABS_ORDER = ['tracks', 'collabs'];
const TAB_ICONS = { tracks: '🎵', collabs: '🤝' };

export default function ProfileTabs({ activeTab, setActiveTab, tracksCount, collaborationsCount }) {
  const tabs = [
    { id: 'tracks', label: 'Tracks', count: tracksCount },
    { id: 'collabs', label: 'Collaborations', count: collaborationsCount },
  ];

  const tabRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[TABS_ORDER.indexOf(activeTab)];
    if (el) setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  return (
    <div className="relative mb-6">
      {/* Sliding underline */}
      <div
        className="absolute bottom-0 h-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          left: pillStyle.left,
          width: pillStyle.width,
          background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
          boxShadow: '0 0 12px rgba(20,184,166,0.6)',
        }}
      />

      <div className="flex overflow-x-auto scrollbar-none border-b border-[var(--border-color)]/40">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={el => (tabRefs.current[i] = el)}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-5 py-3 text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 group"
            style={{ color: activeTab === tab.id ? '#14b8a6' : 'var(--text-tertiary)' }}
          >
            {/* Hover bg */}
            <span className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(20,184,166,0.06)' }} />
            {/* Active bg */}
            {activeTab === tab.id && (
              <span className="absolute inset-0 rounded-t-xl" style={{ background: 'rgba(20,184,166,0.08)' }} />
            )}
            <span className="relative flex items-center gap-2">
              <span style={{
                display: 'inline-block',
                transform: activeTab === tab.id ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s',
              }}>
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}