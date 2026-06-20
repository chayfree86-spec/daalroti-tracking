import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'

// Copy the PHP API into the build output so `dist/` is a complete, deployable
// folder (on Hostinger the subdomain docroot is `dist`). Runs AFTER Vite empties
// and writes dist, so `dist/api/` is always present after every build and never
// wiped. Source of truth stays at the project root `api/`.
function copyPhpApi() {
  return {
    name: 'copy-php-api',
    apply: 'build',
    closeBundle() {
      cpSync(resolve(process.cwd(), 'api'), resolve(process.cwd(), 'dist', 'api'), {
        recursive: true,
      })
      console.log('\n✓ Copied api/ → dist/api/')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    proxy: {
      // Forward API calls to the Express + MySQL backend during dev.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    copyPhpApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-32x32.png', 'favicon-48x48.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'DaalRoti Tracker',
        short_name: 'DaalRoti',
        description: 'Daily Balance & Expense Tracker',
        theme_color: '#F59E0B',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
