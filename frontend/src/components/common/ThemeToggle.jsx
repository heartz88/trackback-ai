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
        width: '52px',
        minWidth: '52px',
        height: '28px',
        borderRadius: '14px',
        border: isLightMode ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(99,179,237,0.25)',
        background: isLightMode
          ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
          : 'linear-gradient(135deg, #1e3a5f, #0f2340)',
        cursor: 'pointer',
        flexShrink: 0,
        padding: 0,
        WebkitAppearance: 'none',
        appearance: 'none',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      {/* Knob */}
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: isLightMode ? '#fff8e1' : 'white',
          boxShadow: isLightMode
            ? '0 2px 6px rgba(251,191,36,0.4)'
            : '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          lineHeight: 1,
          transform: isLightMode ? 'translateX(24px)' : 'translateX(0)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {isLightMode ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default ThemeToggle;