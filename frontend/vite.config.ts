import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    allowedHosts: ['localhost'],
    proxy: {
      '/register': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },
      '/signin': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
})