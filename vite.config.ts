import { defineConfig } from 'vite';
import revideo from '@revideo/vite-plugin';

export default defineConfig({
  plugins: [revideo()],
  server: {
    hmr: false, // Disable HMR for renderer
  },
  build: {
    target: 'esnext',
  }
});
