/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'
import { basicAuthPlugin } from './basic-auth.plugin.mts'

export default defineConfig(({ mode }) => {
  // Root .env lives two levels up from this app (workspace root), not in this app's own folder.
  const env = { ...process.env, ...loadEnv(mode, '../..', '') }
  const backendPort = env.JDR_PORT || env.PORT || '8081'

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/admin-jdr',
    server: {
      port: 4203,
      host: 'localhost',
      proxy: {
        '/api': { target: `http://localhost:${backendPort}`, changeOrigin: true }
      }
    },
    preview: {
      port: 4203,
      host: 'localhost'
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), basicAuthPlugin(env.ADMIN_USERNAME, env.ADMIN_PASSWORD)],
    build: {
      outDir: '../../dist/apps/admin-jdr',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/test-setup.ts',
      coverage: {
        reportsDirectory: '../../coverage/apps/admin-jdr',
        provider: 'v8'
      }
    }
  }
})
