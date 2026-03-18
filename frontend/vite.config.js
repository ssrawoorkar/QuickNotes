import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
      '/transcribe': 'http://localhost:8000',
      '/notes': 'http://localhost:8000',
      '/drive': 'http://localhost:8000',
    }
  }
})
