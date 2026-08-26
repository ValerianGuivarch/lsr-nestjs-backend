/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '../..', ''), ...process.env }
  const jdrTarget = env.JDR_BACKEND_ORIGIN ?? `http://localhost:${env.JDR_PORT ?? 3333}`
  const diaryTarget = env.YEARDIARY_BACKEND_ORIGIN ?? `http://localhost:${env.YEARDIARY_PORT ?? 8081}`
  const disableHmr = env.VITE_DISABLE_HMR === 'true'
  const apiProxy = {
    '/apil7r/pf2-mj': {
      target: env.PF2_BACKEND_ORIGIN ?? jdrTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apil7r\/pf2-mj/, '/api/pf2-mj')
    },
    '/apil7r/jdr': {
      target: jdrTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apil7r\/jdr/, '/api/v1/jdr')
    },
    '/apil7r/media': {
      target: jdrTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apil7r\/media/, '/api/media')
    },
    '/apil7r/v1/diaries': {
      target: diaryTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apil7r\/v1\/diaries/, '/api/v1/diaries')
    },
    '/apil7r': { target: diaryTarget, changeOrigin: true }
  }

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/web-misc',
    server: {
      port: 3000,
      host: 'localhost',
      allowedHosts: ['l7r.fr', 'www.l7r.fr'],
      hmr: disableHmr ? false : undefined,
      proxy: apiProxy
    },
    preview: {
      port: 3000,
      host: 'localhost',
      allowedHosts: ['l7r.fr', 'www.l7r.fr'],
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
