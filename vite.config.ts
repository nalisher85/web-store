import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'


// ✅ Используем вместо __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',      // КУДА складывать билд
    assetsDir: 'assets', // Папка ассетов внутри outDir
    emptyOutDir: true,   // Перед билдом чистить dist/
  },
  // НЕ указывать outDir: '.' и не трогать assetsDir в корень!
})
