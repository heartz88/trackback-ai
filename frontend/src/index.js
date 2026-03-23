import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const AppWrapper = () => {
  React.useEffect(() => {
    // Ensure all interactive elements have proper touch behavior
    const fixTouchElements = () => {
      const interactive = document.querySelectorAll('button, a, input, textarea, select');
      interactive.forEach(el => {
        // Only add touch-action if not already set
        if (getComputedStyle(el).touchAction !== 'manipulation') {
          el.style.touchAction = 'manipulation';
        }
      });
    };
    
    fixTouchElements();
    
    const observer = new MutationObserver(fixTouchElements);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  
  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);