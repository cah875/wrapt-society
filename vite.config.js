import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During local dev, `vercel dev` serves the /api functions on the same
    // origin. If you run plain `vite`, point the proxy at your local API.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // ExcelJS is lazy-loaded into its own chunk, so a larger limit is expected.
    chunkSizeWarningLimit: 1000,
  },
});
