
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://my-first-backend.khoshigaki35.workers.dev',
        changeOrigin: true,
      },
    },
  },
})

