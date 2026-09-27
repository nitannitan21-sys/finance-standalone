import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Personal Finance',
        short_name: 'SFinance',
        description: 'Personal finance tracker',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
icons: [
  {
    src: '/pwa-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/pwa-512.png',
    sizes: '512x512',
    type: 'image/png',
  },
  {
    src: '/pwa-512-maskable.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})