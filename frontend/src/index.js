import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Simple wrapper - ensures one-tap works without blocking events
const AppWrapper = () => {
  React.useEffect(() => {
    // Ensure all interactive elements are touch-optimized
    const optimizeAllElements = () => {
      const selectors = [
        'button', 'a', 'input', 'textarea', 'select', 
        '[role="button"]', '.btn-primary', '.btn-secondary', 
        '.action-btn', '.tdp-message-btn', '.row-action-btn',
        '.sp-like-btn', '.sp-action-btn', '.filter-toggle-btn'
      ];
      
      const elements = document.querySelectorAll(selectors.join(','));
      
      elements.forEach(el => {
        if (el.getAttribute('data-touch-optimized')) return;
        el.setAttribute('data-touch-optimized', 'true');
        
        // Ensure no pointer-events blocking
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
        
        // Apply touch-manipulation class if not already applied
        if (!el.classList.contains('touch-manipulation')) {
          el.classList.add('touch-manipulation');
        }
      });
    };
    
    // Run immediately
    optimizeAllElements();
    
    // Watch for dynamically added elements
    const observer = new MutationObserver(() => {
      optimizeAllElements();
    });
    
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