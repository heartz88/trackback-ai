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
      className="mode-switch"
      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
    />
  );
}

export default ThemeToggle;