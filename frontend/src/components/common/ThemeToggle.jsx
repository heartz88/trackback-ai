import { useEffect, useState } from 'react';

function ThemeToggle() {
const [isLightMode, setIsLightMode] = useState(() => {
// Check localStorage first
const savedTheme = localStorage.getItem('theme');
if (savedTheme) return savedTheme === 'light';

// Default to dark mode if no preference
return false;
});

useEffect(() => {
// Apply theme to frontend and save preference to localStorage
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

const toggleTheme = () => {
setIsLightMode(!isLightMode);
};

return (
<button
    onClick={toggleTheme}
    className="mode-switch flex items-center justify-center w-12 h-6"
    aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
    title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
/>
);
}

export default ThemeToggle;