import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration object
export default defineConfig({
  // Vite plugins to use
  plugins: [
    react(),  // React plugin for JSX support and Fast Refresh
  ],
})
