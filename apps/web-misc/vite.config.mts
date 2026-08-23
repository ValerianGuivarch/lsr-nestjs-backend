/// <reference types='vitest' />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'

export default defineConfig(() => {
  // In real prod, nginx forwards /apil7r/* straight to the unified backend (which rewrites it internally).
  // Locally (dev or vite preview), there's no nginx, so proxy it ourselves to the same backend port.
  const backendTarget = process.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:8081'
  const apiProxy = {
    '/apil7r/pf2-mj': {
      target: process.env.PF2_BACKEND_ORIGIN ?? 'http://localhost:3333',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apil7r\/pf2-mj/, '/api/v1/pf2-mj')
    },
    '/apil7r': { target: backendTarget, changeOrigin: true }
  }

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/web-misc',
    server: {
      port: 3000,
      host: 'localhost',
      proxy: apiProxy
    },
    preview: {
      port: 3000,
      host: 'localhost',
      proxy: apiProxy
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    // Uncomment this if you are using workers.
    // worker: {
    //   plugins: () => [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../../dist/apps/web-misc',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  }
})
