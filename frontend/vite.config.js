import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      devOptions: {
        // Without this, installability only works on a production build
        // (npm run build && npm run preview) — enabling it here means
        // `npm run dev` is installable too, for easier local testing.
        enabled: true
      },
      manifest: {
        name: 'Genje Group',
        short_name: 'Genje Group',
        description: 'Chama Ledger — savings, loans, meetings, and M-Pesa in one place.',
        theme_color: '#14231C',
        background_color: '#EFEBE0',
        display: 'standalone',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache the app shell so it reopens instantly and doesn't blank-screen
        // on a flaky connection. API calls (to your Express backend) are
        // intentionally NOT cached here — this app needs live data, not
        // stale offline data pretending to be current.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/(auth|members|contributions|loans|repayments|meetings|audit|mpesa|settings)\//]
      }
    })
  ],
})
