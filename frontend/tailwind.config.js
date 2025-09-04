/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orbital: {
          primary: '#f97316',
          secondary: '#ea580c',
          accent: '#fb923c',
          background: '#0a0a0f',
          surface: '#1a1a1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'orbit': 'orbit 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 2s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 10s linear infinite',
        'orbital-spin': 'orbital-spin 2s linear infinite',
        'data-stream': 'data-stream 2s linear infinite',
        'hologram-flicker': 'hologram-flicker 3s ease-in-out infinite',
        'cyber-grid': 'grid-move 20s linear infinite',
        'particle-float': 'particle-float 8s ease-in-out infinite',
        'neural-pulse': 'neural-pulse 15s ease-in-out infinite',
        'holo-scan': 'holo-scan 3s ease-in-out infinite',
        'quantum-spin': 'quantum-spin 1.5s linear infinite',
        'chart-slide-in': 'chartSlideIn 0.8s ease-out',
        'chart-pulse': 'chartPulse 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'transform': 'translateX(0%)',
          },
          '50%': {
            'transform': 'translateX(-100%)',
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'transform': 'translateY(0%)',
          },
          '50%': {
            'transform': 'translateY(-100%)',
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            'transform': 'translate(0%, 0%)',
          },
          '25%': {
            'transform': 'translate(-100%, 0%)',
          },
          '50%': {
            'transform': 'translate(-100%, -100%)',
          },
          '75%': {
            'transform': 'translate(0%, -100%)',
          },
        },
        'orbit': {
          'from': {
            'transform': 'rotate(0deg) translateX(20px) rotate(0deg)',
          },
          'to': {
            'transform': 'rotate(360deg) translateX(20px) rotate(-360deg)',
          },
        },
        'float': {
          '0%, 100%': {
            'transform': 'translateY(0px) rotate(0deg)',
          },
          '33%': {
            'transform': 'translateY(-20px) rotate(120deg)',
          },
          '66%': {
            'transform': 'translateY(10px) rotate(240deg)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)',
            'transform': 'scale(1)',
          },
          '50%': {
            'box-shadow': '0 0 30px rgba(0, 212, 255, 0.6), 0 0 60px rgba(0, 212, 255, 0.2)',
            'transform': 'scale(1.02)',
          },
        },
        'neon-flicker': {
          '0%, 100%': { 'opacity': '1' },
          '50%': { 'opacity': '0.8' },
          '75%': { 'opacity': '0.9' },
        },
        'matrix-rain': {
          '0%': {
            'transform': 'translateY(-100vh)',
            'opacity': '0',
          },
          '10%': { 'opacity': '1' },
          '90%': { 'opacity': '1' },
          '100%': {
            'transform': 'translateY(100vh)',
            'opacity': '0',
          },
        },
        'orbital-spin': {
          'from': { 'transform': 'rotate(0deg)' },
          'to': { 'transform': 'rotate(360deg)' },
        },
        'data-stream': {
          '0%': {
            'transform': 'translateX(-100%)',
            'opacity': '0',
          },
          '50%': { 'opacity': '1' },
          '100%': {
            'transform': 'translateX(100%)',
            'opacity': '0',
          },
        },
        'hologram-flicker': {
          '0%, 100%': {
            'opacity': '1',
            'filter': 'hue-rotate(0deg)',
          },
          '25%': {
            'opacity': '0.8',
            'filter': 'hue-rotate(90deg)',
          },
          '50%': {
            'opacity': '0.9',
            'filter': 'hue-rotate(180deg)',
          },
          '75%': {
            'opacity': '0.85',
            'filter': 'hue-rotate(270deg)',
          },
        },
        'grid-move': {
          '0%': { 'background-position': '0 0' },
          '100%': { 'background-position': '50px 50px' },
        },
        'particle-float': {
          '0%, 100%': { 
            'transform': 'translate(0, 0) rotate(0deg)', 
            'opacity': '0.3' 
          },
          '25%': { 
            'transform': 'translate(100px, -50px) rotate(90deg)', 
            'opacity': '0.8' 
          },
          '50%': { 
            'transform': 'translate(200px, 20px) rotate(180deg)', 
            'opacity': '1' 
          },
          '75%': { 
            'transform': 'translate(50px, 80px) rotate(270deg)', 
            'opacity': '0.6' 
          },
        },
        'neural-pulse': {
          '0%, 100%': { 
            'opacity': '0.5', 
            'transform': 'scale(1)' 
          },
          '50%': { 
            'opacity': '0.8', 
            'transform': 'scale(1.05)' 
          },
        },
        'holo-scan': {
          '0%, 100%': { 
            'opacity': '0', 
            'transform': 'translateX(-100%)' 
          },
          '50%': { 
            'opacity': '1', 
            'transform': 'translateX(100%)' 
          },
        },
        'quantum-spin': {
          '0%': { 'transform': 'rotate(0deg)' },
          '100%': { 'transform': 'rotate(360deg)' },
        },
        'chartSlideIn': {
          'from': {
            'opacity': '0',
            'transform': 'translateY(20px)',
          },
          'to': {
            'opacity': '1',
            'transform': 'translateY(0)',
          },
        },
        'chartPulse': {
          '0%, 100%': { 'opacity': '0.8' },
          '50%': { 'opacity': '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'orbital': '0 0 30px rgba(249, 115, 22, 0.4)',
        'cyber': '0 0 20px rgba(0, 212, 255, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'cyber-grid': '50px 50px',
      },
    },
  },
  plugins: [],
}