import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global touch optimization wrapper
const TouchOptimizedApp = () => {
  React.useEffect(() => {
    // Function to ensure all interactive elements have proper touch handling
    const enhanceTouchElements = () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, textarea, select, [role="button"]'
      );
      
      interactiveElements.forEach(el => {
        // Add data attribute to prevent double processing
        if (el.getAttribute('data-touch-enhanced') === 'true') return;
        el.setAttribute('data-touch-enhanced', 'true');
        
        // Ensure all buttons have proper CSS
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
          el.style.touchAction = 'manipulation';
        }
      });
    };
    
    // Run initially
    enhanceTouchElements();
    
    // Watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.matches && node.matches('button, a, input, textarea, select, [role="button"]')) {
              if (!node.getAttribute('data-touch-enhanced')) {
                node.setAttribute('data-touch-enhanced', 'true');
                node.style.touchAction = 'manipulation';
              }
            }
            if (node.querySelectorAll) {
              node.querySelectorAll('button, a, input, textarea, select, [role="button"]').forEach(el => {
                if (!el.getAttribute('data-touch-enhanced')) {
                  el.setAttribute('data-touch-enhanced', 'true');
                  el.style.touchAction = 'manipulation';
                }
              });
            }
          }
        });
      });
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