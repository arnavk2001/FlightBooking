import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bookingbot/', // Base path for deployment
  server: {
    port: 3000,
    headers: {
      // Allow eval for Vite HMR in development - Required for Vite dev server
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* wss://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* wss://localhost:*; style-src 'self' 'unsafe-inline'; connect-src 'self' 'unsafe-inline' http://localhost:* ws://localhost:* wss://localhost:* https://*.amadeus.com https://*.paypal.com https://api.sandbox.paypal.com https://api.paypal.com; img-src 'self' data: https:; font-src 'self' data:;"
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
        // Keep /api prefix when forwarding to backend
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Use safer build options for production
    rollupOptions: {
      output: {
        // Disable eval in production builds
        format: 'es',
        manualChunks: undefined
      }
    }
  },
  // Configure CSP for production if needed
  define: {
    // Ensure no eval is used in production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})

