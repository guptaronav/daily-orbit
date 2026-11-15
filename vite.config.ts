/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable, and fully usable offline after the first visit: the service worker precaches
    // the app, the bundled NASA data, the face model and its WASM runtime (about 19 MB), so even
    // the camera check runs with no link to Earth.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Daily Orbit',
        short_name: 'Daily Orbit',
        description: 'A one-minute daily health check for astronauts, compared with your own baseline. Works offline.',
        theme_color: '#14181f',
        background_color: '#f3f1ea',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,wasm,task,webm}'],
        // The face model (3.8 MB) and the vision WASM (14.7 MB) must be cached for offline camera checks.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] },
})
