import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identité neutre client
        canvas: '#F4F5F7',
        ink: {
          DEFAULT: '#16202E',
          soft: '#243447',
        },
        accent: {
          DEFAULT: '#1E4FD8',
          soft: '#4F7BEC',
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
