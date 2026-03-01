import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // ADD THESE HEADERS BELOW
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8800',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8800',
        ws: true,
      },
    },
  },
});