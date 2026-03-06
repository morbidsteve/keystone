import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--color-bg)',
          elevated: 'var(--color-bg-elevated)',
          surface: 'var(--color-bg-surface)',
          hover: 'var(--color-bg-hover)',
          card: 'var(--color-bg-card)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          bright: 'var(--color-text-bright)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      fontSize: {
        '2xs': '10px',
        '3xs': '9px',
      },
      transitionDuration: {
        theme: 'var(--transition)',
      },
    },
  },
  plugins: [],
} satisfies Config;
