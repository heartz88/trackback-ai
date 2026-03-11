import { useEffect, useState } from 'react';

function ThemeToggle() {
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'light' : false;
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <button
      onClick={() => setIsLightMode(p => !p)}
      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        position: 'relative',
        width: 44,
        height: 24,
        minWidth: 44,
        maxWidth: 44,
        flexShrink: 0,
        borderRadius: 12,
        border: isLightMode ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(99,179,237,0.3)',
        background: isLightMode ? '#fbbf24' : '#1e3a5f',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        WebkitAppearance: 'none',
        appearance: 'none',
        boxSizing: 'border-box',
        display: 'block',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Knob — pure div, no emoji */}
      <span style={{
        position: 'absolute',
        top: 2,
        left: isLightMode ? 22 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {/* Sun icon (light mode) */}
        {isLightMode ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          /* Moon icon (dark mode) */
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#93c5fd" stroke="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;