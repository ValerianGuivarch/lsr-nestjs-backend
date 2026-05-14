/// <reference types='vitest' />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web-l7r',
  server: {
    port: 3000,
    host: 'localhost',
    allowedHosts: true,
    proxy: {
      '/apil7r': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/apil7r/, '/api')
      }
    }
  },
  preview: {
    port: 3000,
    host: 'localhost',
    allowedHosts: true
  },
  plugins: [react()],
  resolve: {
    tsconfigPaths: true
  },
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../dist/apps/web-l7r',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}))
