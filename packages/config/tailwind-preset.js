/**
 * Campus Bytes — shared Tailwind design-token preset.
 *
 * Colors are wired to CSS variables (defined in the web app's globals.css) so the
 * same token set can be themed per surface. Never use raw hex in components — use
 * these semantic tokens (bg-brand, text-ink, border-line, text-success, …).
 */

/** @type {import('tailwindcss').Config} */
const preset = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Brand — warm coral-orange. Used sparingly for primary actions & accents.
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          DEFAULT: 'var(--brand-600)',
          fg: 'var(--brand-fg)',
        },
        // Warm neutral surfaces
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          cream: 'var(--surface-cream)',
          peach: 'var(--surface-peach)',
          raised: 'var(--surface-raised)',
        },
        // Ink (text) scale — charcoal-based
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          600: 'var(--ink-600)',
          400: 'var(--ink-400)',
          DEFAULT: 'var(--ink-900)',
        },
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        // Semantic status
        success: {
          DEFAULT: 'var(--success)',
          fg: 'var(--success-fg)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          fg: 'var(--warning-fg)',
          soft: 'var(--warning-soft)',
        },
        error: {
          DEFAULT: 'var(--error)',
          fg: 'var(--error-fg)',
          soft: 'var(--error-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          fg: 'var(--info-fg)',
          soft: 'var(--info-soft)',
        },
        // Focus ring
        ring: 'var(--ring)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // label + body + display scale
        '2xs': ['0.75rem', { lineHeight: '1rem' }], // 12
        xs: ['0.8125rem', { lineHeight: '1.125rem' }], // 13
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14
        base: ['1rem', { lineHeight: '1.5rem' }], // 16
        lg: ['1.125rem', { lineHeight: '1.625rem' }], // 18
        xl: ['1.375rem', { lineHeight: '1.75rem' }], // 22
        '2xl': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.01em' }], // 28
        '3xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }], // 36
        '4xl': ['3rem', { lineHeight: '3.125rem', letterSpacing: '-0.02em' }], // 48
      },
      spacing: {
        // 4px base scale + a few named steps
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '0.5rem', // 8
        md: '0.75rem', // 12
        lg: '1rem', // 16
        xl: '1.5rem', // 24
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(31, 27, 24, 0.04), 0 1px 3px 0 rgba(31, 27, 24, 0.06)',
        md: '0 4px 12px -2px rgba(31, 27, 24, 0.08), 0 2px 6px -2px rgba(31, 27, 24, 0.06)',
        lg: '0 16px 40px -8px rgba(31, 27, 24, 0.16), 0 6px 16px -6px rgba(31, 27, 24, 0.10)',
        focus: '0 0 0 3px var(--ring)',
      },
      maxWidth: {
        student: '480px', // mobile-first student column
        content: '1200px',
        dashboard: '1600px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(240, 86, 45, 0.35)' },
          '70%': { boxShadow: '0 0 0 10px rgba(240, 86, 45, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240, 86, 45, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.18s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.66, 0, 0, 1) infinite',
      },
    },
  },
};

export default preset;
