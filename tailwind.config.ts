import type { Config } from 'tailwindcss';

// Palette issue de la maquette de référence (PMO_NARSA_Strategic.html) :
// tons oklch sur une teinte verte 150-155, sidebar vert sombre, accents
// statut (vert 155 / bleu 240 / rouge 25 / orange 70) avec fonds pastel.
// Les noms de classes historiques (canvas, ink, accent, statut.*) sont
// conservés pour ne pas toucher chaque composant ; seules les valeurs changent.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'oklch(97% 0.008 150)',
        card: '#ffffff',
        borderc: 'oklch(90% 0.012 150)',
        ink: {
          DEFAULT: 'oklch(22% 0.015 150)',
          soft: 'oklch(48% 0.015 150)',
        },
        muted: 'oklch(48% 0.015 150)',
        brand: {
          DEFAULT: 'oklch(44% 0.11 155)',
          bright: 'oklch(56% 0.135 155)',
          dark: 'oklch(24% 0.045 155)',
          dark2: 'oklch(20% 0.05 155)',
        },
        accent: {
          DEFAULT: 'oklch(44% 0.11 155)',
          soft: 'oklch(56% 0.135 155)',
        },
        statut: {
          vert: 'oklch(56% 0.13 155)',
          'vert-bg': 'oklch(93% 0.045 155)',
          bleu: 'oklch(56% 0.13 240)',
          'bleu-bg': 'oklch(93% 0.03 240)',
          ambre: 'oklch(62% 0.15 70)',
          'ambre-bg': 'oklch(93% 0.05 75)',
          rouge: 'oklch(58% 0.19 25)',
          'rouge-bg': 'oklch(93% 0.045 25)',
          gris: 'oklch(48% 0.015 150)',
          'gris-bg': 'oklch(94% 0.005 150)',
        },
      },
      fontFamily: {
        title: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.45s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
