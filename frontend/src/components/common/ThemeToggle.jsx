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

  // Wrap in a div to completely isolate from flex parent sizing
  return (
    <div style={{ width: 44, height: 24, flexShrink: 0, display: 'inline-flex' }}>
      <button
        onClick={() => setIsLightMode(p => !p)}
        aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          minWidth: '44px',
          maxWidth: '44px',
          minHeight: '24px',
          maxHeight: '24px',
          borderRadius: '12px',
          border: isLightMode ? '1px solid rgba(0, 0, 0, 0.5)' : '1px solid rgba(99,179,237,0.3)',
          background: isLightMode ? '#f8f8f8' : '#1e3a5f',
          cursor: 'pointer',
          padding: '0',
          margin: '0',
          outline: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
          boxSizing: 'border-box',
          display: 'block',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Knob */}
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: isLightMode ? '23px' : '3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
            transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      </button>
    </div>
  );
}

export default ThemeToggle;