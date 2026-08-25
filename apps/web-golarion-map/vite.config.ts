import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { defineConfig, type UserConfig } from 'vite'
import style from './src/ml-style/style'

const jsonModule = 'virtual:style'
const resolvedJsonModule = `\0${jsonModule}`

export default defineConfig(({ command, isPreview, mode }): UserConfig => {
  const defaultAssetsRoot = resolve(import.meta.dirname, '../../../../GolarionMapData')
  const legacyAssetsRoot = resolve(homedir(), 'Developer/golarion-map-build/mapping/frontend/public')
  const configuredAssetsRoot = process.env['GOLARION_MAP_ASSETS_DIR']
    ? resolve(process.env['GOLARION_MAP_ASSETS_DIR'])
    : undefined
  const assetsRoot = configuredAssetsRoot
    ?? [defaultAssetsRoot, legacyAssetsRoot].find((path) => existsSync(resolve(path, 'golarion.pmtiles')))
    ?? defaultAssetsRoot
  const placeNamesPath = resolve(assetsRoot, 'place-names.fr.json')
  const fallbackPlaceNamesPath = resolve(import.meta.dirname, 'resources/place-names.fr.json')

  const dataHash = Math.floor(Date.now() / 1000)
  const publicOrigin = (process.env['GOLARION_MAP_PUBLIC_ORIGIN'] ?? '').replace(/\/$/, '')
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
        }
      }
    ],
    server: {
      port: 4204,
      host: '0.0.0.0',
      strictPort: true
    },
    preview: {
      port: 4204,
      host: '0.0.0.0',
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
