import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: false,
      gzipSize: true,
      filename: 'dist/bundle-stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 155KB gzipped is acceptable for internal tool with 30 users.
    // Page components are already split into separate lazy chunks.
    chunkSizeWarningLimit: 600,
    sourcemap: true,
  },
})
