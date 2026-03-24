/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
"./src/**/*.{js,jsx,ts,tsx}",
],
darkMode: 'class',
theme: {
extend: {
    colors: {
    // Teal color palette
    primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14B8A6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
    },
    },
    animation: {
    'fade-in': 'fadeIn 0.6s ease-out',
    'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
    'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
    },
    keyframes: {
    fadeIn: {
        'from': { opacity: '0' },
        'to': { opacity: '1' },
    },
    slideUp: {
        'from': { opacity: '0', transform: 'translateY(30px)' },
        'to': { opacity: '1', transform: 'translateY(0)' },
    },
    bounceSlow: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
    },
    pulseGlow: {
        '0%, 100%': {
        boxShadow: '0 0 20px rgba(20, 184, 166, 0.4)'
        },
        '50%': {
        boxShadow: '0 0 40px rgba(20, 184, 166, 0.8)'
        },
    },
    },
    boxShadow: {
    'teal': '0 0 20px rgba(20, 184, 166, 0.5), 0 0 40px rgba(20, 184, 166, 0.3)',
    'teal-lg': '0 0 30px rgba(20, 184, 166, 0.6), 0 0 60px rgba(20, 184, 166, 0.4)',
    },
    spacing: {
    'touch': '44px', 
    },
},
},
plugins: [
  function({ addUtilities }) {
      addUtilities({
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
      });
    },
],
}