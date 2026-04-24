import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'tslib'],
    exclude: ['recharts', 'd3-shape', 'd3-scale', 'd3-interpolate', 'd3-path', 'd3-time', 'd3-time-format', 'd3-array', 'd3-format', 'd3-color', 'victory-vendor']
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
