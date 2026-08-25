import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
