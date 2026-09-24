import type { Plugin, Connect } from 'vite'

/**
 * Gates access to the admin app (dev server and preview) behind a single shared
 * username/password, read from ADMIN_USERNAME/ADMIN_PASSWORD env vars.
 * This protects only this frontend, not the underlying JDR API, which stays open
 * for the public web-jdr app.
 */
export function basicAuthPlugin(username: string | undefined, password: string | undefined): Plugin {
  const challenge: Connect.NextHandleFunction = (req, res, next) => {
    if (!username || !password) {
      next()
      return
    }

    const header = req.headers.authorization
    const expected = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    if (header === expected) {
      next()
      return
    }

    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="JdR Admin"')
    res.end('Authentication required')
  }

  return {
    name: 'jdr-admin-basic-auth',
    configureServer(server) {
      server.middlewares.use(challenge)
    },
    configurePreviewServer(server) {
      server.middlewares.use(challenge)
    }
  }
}
