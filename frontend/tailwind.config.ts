import type { Config } from 'tailwindcss';

// Exposes every Tailwind color as a global CSS var (e.g. --blue-500), which the
// aurora-background component reads directly. Required by ui/aurora-background.tsx.
const flattenColorPalette = require('tailwindcss/lib/util/flattenColorPalette').default;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addVariablesForColors({ addBase, theme }: any) {
  const allColors = flattenColorPalette(theme('colors'));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val as string])
  );
  addBase({ ':root': newVars });
}

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
        // Late-night cinema: warm black room, gold for judgment, red for love.
        // Posters carry the color; the UI does not.
        ink: '#0B0A09',      // page background
        velvet: '#161310',   // raised surface (cards, dropdowns, inputs)
        seat: '#211C18',     // hover / inset well
        rail: '#2C261F',     // borders, hairlines
        fog: '#8A8278',      // secondary text, captions, placeholders
        screen: '#F3EDE3',   // primary text
        tungsten: { DEFAULT: '#E0A84A', dim: '#B07E2C' },
        ticket: { DEFAULT: '#C23B3B', dim: '#8E2A2A' },

        // Migration aliases — every legacy `surface-*` / `brand` / `gold` class
        // now resolves to the new palette. Prefer the named tokens above.
        surface: { 900: '#0B0A09', 800: '#161310', 700: '#211C18', 600: '#2C261F', 500: '#3A3229' },
        brand: { DEFAULT: '#E0A84A', light: '#E0A84A', dark: '#B07E2C' },
        gold: { DEFAULT: '#E0A84A', light: '#E8C27A' },

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
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      // The whole type scale. Do not invent sizes outside this list.
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['28px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        title: ['18px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        body: ['15px', { lineHeight: '1.6', letterSpacing: '0' }],
        ui: ['13px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        meta: ['12px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
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
        aurora: 'aurora 60s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        aurora: {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to: { backgroundPosition: '350% 50%, 350% 50%' },
        },
      },
    },
  },
  plugins: [addVariablesForColors, require('tailwindcss-animate')],
};

export default config;
