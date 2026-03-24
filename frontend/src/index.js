import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// iOS touch fix - removes hover effects on touch devices
const removeHoverOnTouch = () => {
  // Check if it's a touch device
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    // Add a class to the body to disable hover styles
    document.body.classList.add('touch-device');
    
    // Also add inline styles to all buttons to prevent transforms
    const style = document.createElement('style');
    style.textContent = `
      .touch-device button:hover,
      .touch-device a:hover,
      .touch-device [role="button"]:hover,
      .touch-device .btn-primary:hover,
      .touch-device .btn-secondary:hover,
      .touch-device [class*="hover:"]:hover {
        transform: none !important;
        box-shadow: none !important;
        background-color: inherit !important;
        color: inherit !important;
        border-color: inherit !important;
        transition: none !important;
      }
      
      .touch-device .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, var(--accent-primary-dark), var(--accent-primary)) !important;
      }
      
      .touch-device .hover\:-translate-y-0\.5:hover {
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Run the fix
removeHoverOnTouch();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);