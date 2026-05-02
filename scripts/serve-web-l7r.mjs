import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { createServer, request } from 'node:http'

const host = process.env['HOST'] || '127.0.0.1'
const port = Number(process.env['PORT'] || 3000)
const rootDir = normalize(process.env['WEB_ROOT'] || 'dist/apps/web-l7r')
const webImagesDir = normalize(process.env['WEB_IMAGES_DIR'] || join(process.cwd(), 'web_images'))
const defaultL7rImagesDir = existsSync(join(process.cwd(), 'images'))
  ? join(process.cwd(), 'images')
  : join(webImagesDir, 'l7r')
const l7rImagesDir = normalize(process.env['L7R_IMAGES_DIR'] || defaultL7rImagesDir)
const apiMainOrigin = process.env['API_MAIN_ORIGIN'] || 'http://127.0.0.1:8081'
const apiYearDiaryOrigin = process.env['API_YEARDIARY_ORIGIN'] || 'http://127.0.0.1:8080'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function isYearDiaryPath(pathname) {
  return pathname.startsWith('/api/v1/diaries')
}

function shouldProxyApi(pathname) {
  return pathname.startsWith('/api/')
}

function isL7rImagePath(pathname) {
  return pathname.startsWith('/l7r/')
}

function hasFileExtension(pathname) {
  return extname(pathname).length > 0
}

function proxyRequest(req, res, targetOrigin) {
  const targetUrl = new URL(req.url || '/', targetOrigin)

  const proxy = request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        connection: 'close'
      }
    },
    (proxyRes) => {
      res.statusCode = proxyRes.statusCode || 502
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value)
        }
      })
      proxyRes.pipe(res)
    }
  )

  proxy.on('error', () => {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'Bad Gateway' }))
  })

  req.pipe(proxy)
}

function resolvePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^\.?(\/|\\)/, '')
  let filePath = join(rootDir, safePath)

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    if (hasFileExtension(safePath)) {
      return undefined
    }
    filePath = join(rootDir, 'index.html')
  }

  return filePath
}

function resolveL7rImagePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0])
  const relative = normalize(pathname.replace(/^\/l7r\//, '')).replace(/^\.?(\/|\\)/, '')
  const filePath = join(l7rImagesDir, relative)

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    return undefined
  }

  return filePath
}

const server = createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0]

  if (shouldProxyApi(pathname)) {
    const targetOrigin = isYearDiaryPath(pathname) ? apiYearDiaryOrigin : apiMainOrigin
    proxyRequest(req, res, targetOrigin)
    return
  }

  if (isL7rImagePath(pathname)) {
    const imagePath = resolveL7rImagePath(req.url || '/')

    if (!imagePath) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ message: 'Not Found' }))
      return
    }

    const ext = extname(imagePath)
    const contentType = contentTypes[ext] || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    createReadStream(imagePath)
      .on('error', () => {
        res.statusCode = 500
        res.end('Internal Server Error')
      })
      .pipe(res)
    return
  }

  const filePath = resolvePath(req.url || '/')
  if (!filePath) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'Not Found' }))
    return
  }
  const ext = extname(filePath)
  const contentType = contentTypes[ext] || 'application/octet-stream'

  res.setHeader('Content-Type', contentType)
  createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 500
      res.end('Internal Server Error')
    })
    .pipe(res)
})

server.listen(port, host, () => {
  console.log(`web-l7r static server listening on http://${host}:${port}`)
})
