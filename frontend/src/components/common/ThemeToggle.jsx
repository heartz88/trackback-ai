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
      title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        position: 'relative',
        width: 48,
        height: 26,
        minWidth: 48,
        flexShrink: 0,
        borderRadius: 13,
        border: isLightMode ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(99,179,237,0.25)',
        background: isLightMode
          ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
          : 'linear-gradient(135deg, #1e3a5f, #0f2340)',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        WebkitAppearance: 'none',
        appearance: 'none',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Stars — only in dark mode */}
      {!isLightMode && (
        <span style={{
          position: 'absolute',
          top: 5,
          right: 6,
          fontSize: 5,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 2,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>· · ·</span>
      )}

      {/* Knob */}
      <span style={{
        position: 'absolute',
        top: 3,
        left: isLightMode ? 'calc(100% - 22px - 3px)' : 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: isLightMode ? '#fff8e1' : '#ffffff',
        boxShadow: isLightMode
          ? '0 1px 4px rgba(251,191,36,0.5)'
          : '0 1px 4px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        lineHeight: 1,
        transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {isLightMode ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default ThemeToggle;