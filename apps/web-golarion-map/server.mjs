import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { dirname, extname, resolve, sep } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(appRoot, '../..')
const envPath = resolve(workspaceRoot, '.env')
if (existsSync(envPath)) loadEnvFile(envPath)
const buildRoot = resolve(appRoot, '../../dist/apps/web-golarion-map')
const defaultAssetsRoot = resolve(appRoot, '../../../../GolarionMapData')
const legacyAssetsRoot = resolve(homedir(), 'Developer/golarion-map-build/mapping/frontend/public')
const configuredAssetsRoot = process.env.GOLARION_MAP_ASSETS_DIR
  ? resolve(process.env.GOLARION_MAP_ASSETS_DIR)
  : undefined
const assetsRoot = configuredAssetsRoot
  ?? [defaultAssetsRoot, legacyAssetsRoot].find((path) => existsSync(resolve(path, 'golarion.pmtiles')))
  ?? defaultAssetsRoot
const host = process.env.GOLARION_MAP_HOST ?? '0.0.0.0'
const port = Number(process.env.GOLARION_MAP_PORT ?? 4204)
const requestedPlayerDetail = process.env.GOLARION_MAP_PJ_DETAIL?.trim().toLowerCase()
const playerDetail = ['essential', 'standard', 'detailed'].includes(requestedPlayerDetail)
  ? requestedPlayerDetail
  : 'standard'
const runtimeConfigSource = `window.GOLARION_MAP_CONFIG=${JSON.stringify({ playerDetail })};`

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pbf': 'application/x-protobuf',
  '.pmtiles': 'application/octet-stream',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
}

function resolvePublicFile(root, pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const relativePath = decoded.replace(/^\/+/, '')
  const target = resolve(root, relativePath || 'index.html')
  if (target !== root && !target.startsWith(`${root}${sep}`)) return null
  if (!existsSync(target) || !statSync(target).isFile()) return null
  return target
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '')
  if (!match) return null
  let start = match[1] ? Number(match[1]) : undefined
  let end = match[2] ? Number(match[2]) : undefined
  if (start === undefined && end !== undefined) {
    start = Math.max(size - end, 0)
    end = size - 1
  } else {
    start ??= 0
    end = Math.min(end ?? size - 1, size - 1)
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) return null
  return { start, end }
}

function sendFile(request, response, path) {
  const size = statSync(path).size
  const range = request.headers.range ? parseRange(request.headers.range, size) : null
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', path.endsWith('.pmtiles') ? 'public, max-age=3600' : 'public, max-age=300')
  response.setHeader('Content-Type', mimeTypes[extname(path).toLowerCase()] ?? 'application/octet-stream')

  if (request.headers.range && !range) {
    response.writeHead(416, { 'Content-Range': `bytes */${size}` })
    response.end()
    return
  }

  if (range) {
    response.writeHead(206, {
      'Content-Length': range.end - range.start + 1,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(path, range).pipe(response)
    return
  }

  response.writeHead(200, { 'Content-Length': size })
  if (request.method === 'HEAD') response.end()
  else createReadStream(path).pipe(response)
}

if (!existsSync(resolve(buildRoot, 'index.html'))) {
  throw new Error(`Build Golarion absent : ${buildRoot}/index.html. Lancez npm run build:golarion-map.`)
}
if (!existsSync(resolve(assetsRoot, 'golarion.pmtiles'))) {
  throw new Error(`Ressources Golarion absentes : ${assetsRoot}/golarion.pmtiles. Définissez GOLARION_MAP_ASSETS_DIR.`)
}

const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method ?? '')) {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }

  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  if (pathname === '/runtime-config.js') {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/javascript; charset=utf-8'
    })
    response.end(runtimeConfigSource)
    return
  }
  const file = resolvePublicFile(buildRoot, pathname) ?? resolvePublicFile(assetsRoot, pathname)
  if (file) {
    sendFile(request, response, file)
    return
  }

  if (!extname(pathname)) {
    sendFile(request, response, resolve(buildRoot, 'index.html'))
    return
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end('Fichier introuvable')
})

server.listen(port, host, () => {
  console.log(`Carte Golarion : http://${host}:${port}`)
  console.log(`Build : ${buildRoot}`)
  console.log(`Ressources : ${assetsRoot}`)
})
