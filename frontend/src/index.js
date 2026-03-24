import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Comprehensive iOS double-tap FIX
const fixIosTapDelay = () => {
  // Check for iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    // Add iOS-specific class
    document.documentElement.classList.add('ios-device');
    document.body.classList.add('ios-device');
    
    // Add a style element to force immediate click handling
    const style = document.createElement('style');
    style.textContent = `
      /* iOS double-tap fix - force immediate response */
      .ios-device button,
      .ios-device a,
      .ios-device [role="button"],
      .ios-device .btn-primary,
      .ios-device .btn-secondary,
      .ios-device input,
      .ios-device textarea,
      .ios-device select,
      .ios-device [class*="btn-"] {
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
        transition: none !important;
        cursor: pointer !important;
      }
      
      /* Prevent any transform/transition from causing delay */
      .ios-device button:active,
      .ios-device a:active,
      .ios-device [role="button"]:active {
        transform: scale(0.98) !important;
        transition: transform 0.05s ease !important;
      }
      
      /* Fix password toggle buttons specifically */
      .ios-device .relative button {
        min-height: auto !important;
        height: auto !important;
        transform: translateY(-50%) !important;
        top: 50% !important;
        bottom: auto !important;
        position: absolute !important;
      }
      
      /* Ensure all interactive elements have cursor pointer */
      .ios-device button,
      .ios-device a,
      .ios-device [onClick] {
        cursor: pointer !important;
      }
      
      /* Remove any hover effects that might cause delay */
      .ios-device button:hover,
      .ios-device a:hover,
      .ios-device .btn-primary:hover,
      .ios-device .btn-secondary:hover {
        transform: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Force immediate click handling with touchstart
    document.addEventListener('touchstart', (e) => {
      const element = e.target;
      const clickable = element.closest('button, a, [role="button"], input, textarea, select, [onClick]');
      if (clickable) {
        // Add a tiny delay to ensure click registers but remove any waiting period
        if (clickable.tagName === 'BUTTON' || clickable.tagName === 'A') {
          // Force the element to be ready for click
          clickable.style.transition = 'none';
          setTimeout(() => {
            clickable.style.transition = '';
          }, 50);
        }
      }
    }, { passive: false });
  }
};

// Also handle touch devices in general
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

// Run the fixes
fixIosTapDelay();
removeHoverOnTouch();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);