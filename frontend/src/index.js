import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Touch optimization wrapper - ensures one-tap works on iOS
const TouchOptimizedApp = () => {
  React.useEffect(() => {
    // Ensure all interactive elements respond to touch immediately
    const enhanceTouchElements = () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, [role="button"], .btn-primary, .btn-secondary, .action-btn, input, textarea, select'
      );
      
      interactiveElements.forEach(el => {
        // Mark as processed to avoid duplicate work
        if (el.getAttribute('data-touch-ready')) return;
        el.setAttribute('data-touch-ready', 'true');
        
        // Ensure no pointer-events blocking
        if (window.getComputedStyle(el).pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
        
        // Force touch-action if not already set
        if (window.getComputedStyle(el).touchAction !== 'manipulation') {
          el.style.touchAction = 'manipulation';
        }
      });
    };
    
    // Run immediately
    enhanceTouchElements();
    
    // Watch for dynamically added elements
    const observer = new MutationObserver(() => {
      enhanceTouchElements();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  
  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TouchOptimizedApp />
  </React.StrictMode>
);