import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to Express during development
      // so you don't need CORS configuration
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});