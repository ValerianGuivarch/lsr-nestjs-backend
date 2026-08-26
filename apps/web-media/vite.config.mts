import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '../..', ''), ...process.env }
  const port = Number(env.MEDIA_PORT ?? 4206)
  const apiTarget = env.JDR_BACKEND_ORIGIN ?? `http://localhost:${env.JDR_PORT ?? 3333}`
  return {
    root: import.meta.dirname,
    server: { port, host: 'localhost', strictPort: true, allowedHosts: ['media.l7r.fr'], proxy: { '/api': { target: apiTarget, changeOrigin: true } } },
    preview: { port, host: 'localhost', strictPort: true, allowedHosts: ['media.l7r.fr'], proxy: { '/api': { target: apiTarget, changeOrigin: true } } },
    plugins: [react()],
    build: { outDir: '../../dist/apps/web-media', emptyOutDir: true }
  }
})
