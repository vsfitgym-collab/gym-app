import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'tslib']
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    cssMinify: false
  }
})
