/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_DEMO_MODE === 'true' ? '/keystone/' : (process.env.VITE_BASE_PATH || '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Tile proxies — in production nginx handles these; in dev Vite proxies them
      '/tiles/osm': {
        target: 'https://tile.openstreetmap.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tiles\/osm/, ''),
      },
      '/tiles/satellite': {
        target: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tiles\/satellite/, ''),
      },
      '/tiles/topo': {
        target: 'https://a.tile.opentopomap.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tiles\/topo/, ''),
      },
      // Geocoding proxy
      '/geocode': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/geocode/, ''),
      },
      // API proxy to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
    },
  },
});
