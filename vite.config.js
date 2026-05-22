import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'safari-pinned-tab.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'portfolioTraker',
        short_name: 'ptraker',
        description: 'Private portfolio tracking across all your accounts. No ads, no data sharing.',
        theme_color: '#603cba',
        background_color: '#603cba',
        display: 'standalone',
        orientation: 'any',
        start_url: '/dashboard',
        screenshots: [
          {
            src: 'screenshots/Dashboard-Full-Screenshot.png',
            sizes: '2940x1792',
            type: 'image/png',
            form_factor: 'wide',
            label: 'portfolioTraker dashboard — desktop',
          },
          {
            src: 'screenshots/Dashboard-Mobile-Screenshot.png',
            sizes: '1170x2532',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'portfolioTraker dashboard — mobile',
          },
        ],
        icons: [
          { src: 'icon-64x64.png',              sizes: '64x64',   type: 'image/png' },
          { src: 'icon-128x128.png',            sizes: '128x128', type: 'image/png' },
          { src: 'icon-144x144.png',            sizes: '144x144', type: 'image/png' },
          { src: 'icon-152x152.png',            sizes: '152x152', type: 'image/png' },
          { src: 'icon-192x192.png',            sizes: '192x192', type: 'image/png' },
          { src: 'icon-384x384.png',            sizes: '384x384', type: 'image/png' },
          { src: 'icon-512x512.png',            sizes: '512x512', type: 'image/png' },
          { src: 'icon-192x192-maskable.png',   sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512x512-maskable.png',   sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
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