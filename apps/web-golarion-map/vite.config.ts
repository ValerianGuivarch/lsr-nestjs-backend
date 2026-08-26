import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import style from './src/ml-style/style'

const jsonModule = 'virtual:style'
const resolvedJsonModule = `\0${jsonModule}`

export default defineConfig(({ command, isPreview, mode }): UserConfig => {
  const workspaceRoot = resolve(import.meta.dirname, '../..')
  const env = { ...loadEnv(mode, workspaceRoot, ''), ...process.env }
  const defaultAssetsRoot = resolve(import.meta.dirname, '../../../../GolarionMapData')
  const legacyAssetsRoot = resolve(homedir(), 'Developer/golarion-map-build/mapping/frontend/public')
  const configuredAssetsRoot = env['GOLARION_MAP_ASSETS_DIR']
    ? resolve(env['GOLARION_MAP_ASSETS_DIR'])
    : undefined
  const assetsRoot = configuredAssetsRoot
    ?? [defaultAssetsRoot, legacyAssetsRoot].find((path) => existsSync(resolve(path, 'golarion.pmtiles')))
    ?? defaultAssetsRoot
  const placeNamesPath = resolve(assetsRoot, 'place-names.fr.json')
  const fallbackPlaceNamesPath = resolve(import.meta.dirname, 'resources/place-names.fr.json')

  const dataHash = Math.floor(Date.now() / 1000)
  const publicOrigin = (env['GOLARION_MAP_PUBLIC_ORIGIN'] ?? '').replace(/\/$/, '')
  const requestedPlayerDetail = env['GOLARION_MAP_PJ_DETAIL']?.trim().toLowerCase()
  const playerDetail = ['essential', 'standard', 'detailed'].includes(requestedPlayerDetail ?? '')
    ? requestedPlayerDetail
    : 'standard'
  const runtimeConfigSource = `window.GOLARION_MAP_CONFIG=${JSON.stringify({ playerDetail })};`
  const mapHost = env['GOLARION_MAP_HOST'] ?? '0.0.0.0'
  const mapPort = Number(env['GOLARION_MAP_PORT'] ?? 4204)
  const placeNamesFr = JSON.parse(readFileSync(existsSync(placeNamesPath) ? placeNamesPath : fallbackPlaceNamesPath, 'utf8')) as Record<string, string>
  const compiledStyle = style(publicOrigin, dataHash, placeNamesFr)
  const servesExternalAssets = command === 'serve' && !isPreview

  return {
    root: import.meta.dirname,
    // Development serves the external data directly. Production builds only the
    // application code; the data folder is mounted or copied beside the build.
    publicDir: servesExternalAssets ? assetsRoot : false,
    cacheDir: '../../node_modules/.vite/apps/web-golarion-map',
    define: {
      HOST: JSON.stringify(publicOrigin),
      BUILD_DATA_HASH: dataHash
    },
    plugins: [
      {
        name: 'compile-golarion-style',
        configureServer(server) {
          server.middlewares.use('/runtime-config.js', (_request, response) => {
            response.setHeader('Cache-Control', 'no-store')
            response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            response.end(runtimeConfigSource)
          })
        },
        buildStart() {
          if (!servesExternalAssets) return
          const pmTilesPath = resolve(assetsRoot, 'golarion.pmtiles')
          if (!existsSync(pmTilesPath)) {
            this.error(
              `Ressources Golarion absentes : ${pmTilesPath}. Copiez le contenu de l’ancien dossier public vers ~/GolarionMapData ou définissez GOLARION_MAP_ASSETS_DIR.`
            )
          }
        },
        resolveId(id) {
          return id === jsonModule ? resolvedJsonModule : undefined
        },
        load(id) {
          if (id !== resolvedJsonModule) return undefined
          // maplibre-gl and the validator currently expose two structurally equivalent
          // copies of the style types; the runtime validator is the compatibility boundary.
          for (const error of validateStyleMin(compiledStyle as never)) {
            console.error(`Style validation error: ${error.message} at line ${error.line}`)
          }
          return `export default ${JSON.stringify(compiledStyle)}`
        },
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'style.json', source: JSON.stringify(compiledStyle) })
          this.emitFile({ type: 'asset', fileName: 'runtime-config.js', source: runtimeConfigSource })
        }
      }
    ],
    server: {
      port: mapPort,
      host: mapHost,
      allowedHosts: ['map.l7r.fr'],
      strictPort: true
    },
    preview: {
      port: mapPort,
      host: mapHost,
      allowedHosts: ['map.l7r.fr'],
      strictPort: true
    },
    build: {
      outDir: '../../dist/apps/web-golarion-map',
      emptyOutDir: true,
      target: 'esnext',
      sourcemap: mode === 'development' ? 'inline' : false,
      modulePreload: { polyfill: false },
      chunkSizeWarningLimit: 2048
    }
  }
})
