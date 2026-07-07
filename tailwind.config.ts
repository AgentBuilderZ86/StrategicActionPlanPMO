import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identité NARSA — design « PMO NARSA Strategic » (palette oklch convertie sRGB)
        canvas: '#F1F7F2',
        ligne: '#D9E0DA',
        ink: {
          DEFAULT: '#161D17',
          soft: '#586059',
        },
        sombre: {
          DEFAULT: '#0B2516',
          profond: '#001C0B',
        },
        accent: {
          DEFAULT: '#006436',
          soft: '#0D8B50',
        },
        statut: {
          vert: '#1A8A51',
          ambre: '#BE7200',
          rouge: '#D33A3C',
          bleu: '#007CB8',
          gris: '#586059',
        },
      },
      fontFamily: {
        title: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
