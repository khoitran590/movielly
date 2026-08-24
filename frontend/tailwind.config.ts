import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware cinema palette. RGB channels live in globals.css so the
        // existing semantic class names work unchanged in dark and light mode.
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        velvet: 'rgb(var(--color-velvet) / <alpha-value>)',
        seat: 'rgb(var(--color-seat) / <alpha-value>)',
        rail: 'rgb(var(--color-rail) / <alpha-value>)',
        fog: 'rgb(var(--color-fog) / <alpha-value>)',
        screen: 'rgb(var(--color-screen) / <alpha-value>)',
        tungsten: {
          DEFAULT: 'rgb(var(--color-tungsten) / <alpha-value>)',
          dim: 'rgb(var(--color-tungsten-dim) / <alpha-value>)',
        },
        ticket: {
          DEFAULT: 'rgb(var(--color-ticket) / <alpha-value>)',
          dim: 'rgb(var(--color-ticket-dim) / <alpha-value>)',
        },

        // Migration aliases — every legacy `surface-*` / `brand` / `gold` class
        // now resolves to the new palette. Prefer the named tokens above.
        surface: {
          900: 'rgb(var(--color-ink) / <alpha-value>)',
          800: 'rgb(var(--color-velvet) / <alpha-value>)',
          700: 'rgb(var(--color-seat) / <alpha-value>)',
          600: 'rgb(var(--color-rail) / <alpha-value>)',
          500: 'rgb(var(--color-surface-500) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--color-tungsten) / <alpha-value>)',
          light: 'rgb(var(--color-tungsten) / <alpha-value>)',
          dark: 'rgb(var(--color-tungsten-dim) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-tungsten) / <alpha-value>)',
          light: 'rgb(var(--color-tungsten-light) / <alpha-value>)',
        },

        // shadcn semantic tokens (driven by CSS vars in globals.css).
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
      fontFamily: {
        display: ['var(--font-bodoni-moda)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'monospace'],
      },
      // The whole type scale. Do not invent sizes outside this list.
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['28px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        title: ['18px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        body: ['15px', { lineHeight: '1.6', letterSpacing: '0' }],
        card: ['14px', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
        ui: ['13px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        meta: ['12px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
        caption: ['11px', { lineHeight: '1.35', letterSpacing: '0.02em' }],
        fineprint: ['10px', { lineHeight: '1.35', letterSpacing: '0.02em' }],
        wordmark: ['22px', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'display-hero': ['48px', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        poster: '6px',  // posters and thumbnails — almost sharp, like a print
        panel: '16px',  // modal, dropdown, form card
        '4xl': '2rem',
      },
      boxShadow: {
        // Elevation exists on hovered posters and modals only.
        poster: '0 24px 48px -24px rgba(0,0,0,0.65)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
