import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds the entire app (HTML + CSS + JS, React/Recharts bundled) into a
// single self-contained index.html that opens directly via file:// — no
// server required. Output goes to dist-standalone/.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-standalone',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
