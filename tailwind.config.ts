import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identité NARSA — Sécurité Routière Maroc
        canvas: '#F4F6F5',
        ink: {
          DEFAULT: '#0D2818',
          soft: '#1A3D28',
        },
        accent: {
          DEFAULT: '#006B3F',
          soft: '#2E9E6B',
        },
        statut: {
          vert: '#1B9E62',
          ambre: '#E8A13D',
          rouge: '#D64545',
          gris: '#64748B',
        },
      },
      fontFamily: {
        title: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
