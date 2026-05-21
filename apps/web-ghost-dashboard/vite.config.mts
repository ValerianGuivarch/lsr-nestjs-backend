import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web-ghost-dashboard',
  server: {
    port: 4400,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3100',
        ws: true,
        changeOrigin: true
      },
      '/ghost-audio': {
        target: 'http://127.0.0.1:3100',
        ws: true,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4400,
    host: 'localhost'
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  build: {
    outDir: '../../dist/apps/web-ghost-dashboard',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}))
