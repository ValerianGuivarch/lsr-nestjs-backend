import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '../..', ''), ...process.env }
  const apiTarget = env.RECALBOX_API_ORIGIN ?? `http://localhost:${env.RECALBOX_API_PORT ?? 3335}`
  const proxy = {
    '/recalbox/api': {
      target: apiTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/recalbox\/api/, '/api')
    }
  }

  return {
    base: '/recalbox/',
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/web-recalbox',
    server: {
      port: 3004,
      host: '0.0.0.0',
      allowedHosts: ['l7r.fr', 'www.l7r.fr'],
      proxy
    },
    preview: {
      port: 3004,
      host: '0.0.0.0',
      allowedHosts: ['l7r.fr', 'www.l7r.fr'],
      proxy
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    build: {
      outDir: '../../dist/apps/web-recalbox',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  }
})
