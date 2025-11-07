/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  server: {
    // Mitiga errores EBUSY en Windows/antivirus/OneDrive usando polling
    // y esperando a que el archivo termine de escribirse antes de reaccionar.
    watch: {
      usePolling: true,
      interval: 200,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      } as any,
    },
    // Si el overlay molesta, cámbialo a false
    hmr: { overlay: true },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
