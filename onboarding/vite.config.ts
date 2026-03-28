import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // For Vercel/Netlify root deployments the base should be "/".
  // Override with VITE_BASE_URL only if deploying under a subpath.
  base: process.env.NODE_ENV === 'production' ? (process.env.VITE_BASE_URL || '/') : '/',
  build: {
    outDir: 'dist',
  },
})
