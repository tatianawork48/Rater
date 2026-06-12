import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          surface: '#111118',
          card: '#16161f',
          elevated: '#1c1c28',
        },
        brand: {
          purple: '#7c3aed',
          'purple-light': '#a78bfa',
          'purple-dark': '#5b21b6',
          cyan: '#06b6d4',
          'cyan-light': '#67e8f9',
          'cyan-dark': '#0891b2',
        },
        border: {
          DEFAULT: '#1e1e2e',
          bright: '#2d2d44',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        rating: {
          gold: '#f59e0b',
          silver: '#94a3b8',
        },
        status: {
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh':
          'radial-gradient(at 40% 20%, hsla(270,60%,30%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,60%,25%,0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270,50%,20%,0.2) 0px, transparent 50%)',
        'card-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(124,58,237,0.3)' },
          to: { boxShadow: '0 0 25px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.2)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124,58,237,0.4)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
