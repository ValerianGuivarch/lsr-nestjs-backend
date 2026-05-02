import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { createServer } from 'node:http'

const host = process.env['HOST'] || '127.0.0.1'
const port = Number(process.env['PORT'] || 3000)
const rootDir = normalize(process.env['WEB_ROOT'] || 'dist/apps/web-l7r')

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

function resolvePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^\.?(\/|\\)/, '')
  let filePath = join(rootDir, safePath)

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(rootDir, 'index.html')
  }

  return filePath
}

const server = createServer((req, res) => {
  const filePath = resolvePath(req.url || '/')
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
