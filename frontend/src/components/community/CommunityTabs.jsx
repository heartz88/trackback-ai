import { useEffect, useRef, useState } from 'react';

const TABS = ['Featured', 'Recently Completed', 'Most Voted'];

const TAB_ICONS = ['⭐', '🕐', '🔥'];

export default function CommunityTabs({ activeTab, setActiveTab }) {
    const tabRefs = useRef([]);
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
    const containerRef = useRef(null);
    
    useEffect(() => {
        const el = tabRefs.current[activeTab];
        if (el) {
            setPillStyle({
                left: el.offsetLeft,
                width: el.offsetWidth,
            });
        }
    }, [activeTab]);
    
    return (
        <div className="relative mb-6" ref={containerRef}>
        {/* Glow line under active tab */}
        <div
        className="absolute bottom-0 h-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
            left: pillStyle.left,
            width: pillStyle.width,
            background: 'linear-gradient(90deg, var(--accent-primary), #06b6d4)',
            boxShadow: '0 0 12px rgba(20,184,166,0.6)',
        }}
        />
        
        {/* Tab row */}
        <div className="flex gap-1 border-b border-[var(--border-color)]/40 pb-0">
        {TABS.map((tab, i) => (
            <button
            key={tab}
            ref={el => (tabRefs.current[i] = el)}
            onClick={() => setActiveTab(i)}
            className="relative px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-t-xl group"
            style={{
                color: activeTab === i ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            }}
            >
            {/* Hover bg */}
            <span
            className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(20,184,166,0.06)' }}
            />
            
            {/* Active bg pill */}
            {activeTab === i && (
                <span
                className="absolute inset-0 rounded-t-xl"
                style={{ background: 'rgba(20,184,166,0.08)' }}
                />
            )}
            
            <span className="relative flex items-center gap-1.5">
            <span
            className="text-base transition-transform duration-300"
            style={{ transform: activeTab === i ? 'scale(1.2)' : 'scale(1)' }}
            >
            {TAB_ICONS[i]}
            </span>
            <span className="hidden sm:inline">{tab}</span>
            <span className="sm:hidden">{tab.split(' ')[0]}</span>
            </span>
            </button>
        ))}
        </div>
        </div>
    );
}