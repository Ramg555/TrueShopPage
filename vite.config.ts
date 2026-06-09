import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Tree-shaking + auto-import de componentes Vuetify
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy: el front llama a /api y se redirige al backend .NET,
    // evitando problemas de CORS en desarrollo.
    proxy: {
      '/api': {
        target: 'http://localhost:5150',
        changeOrigin: true,
      },
    },
    watch: {
      // Visual Studio bloquea archivos en .vs/ (índices .vsidx); ignorarlos evita
      // que el watcher de Vite caiga con EBUSY en Windows.
      ignored: ['**/.vs/**', '**/dist/**', '**/.git/**', '**/node_modules/**'],
    },
  },
})
