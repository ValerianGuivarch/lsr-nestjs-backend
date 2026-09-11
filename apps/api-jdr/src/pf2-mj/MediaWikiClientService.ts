import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'

/** Minimal Action API client. Narrative text stays in MediaWiki, never SQLite. */
@Injectable()
export class MediaWikiClientService {
  private readonly logger = new Logger(MediaWikiClientService.name)
  private cookie = ''
  private readonly apiUrl = process.env['PF2_MEDIAWIKI_API_URL']?.trim() ?? ''
  private readonly publicBase = (process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']?.trim() ?? '').replace(/\/$/, '')
  private readonly username = process.env['PF2_MEDIAWIKI_BOT_USERNAME']?.trim() ?? ''
  private readonly password = process.env['PF2_MEDIAWIKI_BOT_PASSWORD'] ?? ''

  enabled(): boolean { return Boolean(this.apiUrl && this.publicBase && this.username && this.password) }
  pageUrl(title: string): string { return `${this.publicBase}/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}` }
  async pageExists(title: string): Promise<boolean> {
    const data = await this.request({ action: 'query', titles: title }) as { query?: { pages?: Record<string, { missing?: unknown }> } }
    return Object.values(data.query?.pages ?? {}).some(page => !('missing' in page))
  }
  async createPage(title: string, text: string): Promise<void> {
    if (await this.pageExists(title)) throw new Error(`La page wiki « ${title} » existe déjà.`)
    const token = await this.token()
    await this.request({ action: 'edit', title, text, token, createonly: '1', summary: 'Création depuis le carnet joueur PF2' }, 'POST')
  }
  async uploadFromUrl(sourceUrl: string, preferredName: string): Promise<string> {
    const source = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) })
    if (!source.ok) throw new ServiceUnavailableException('Portrait source indisponible : représentez à nouveau le personnage.')
    const bytes = await source.arrayBuffer()
    if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new ServiceUnavailableException('Portrait MediaWiki invalide ou trop volumineux.')
    const mimeType = source.headers.get('content-type') ?? 'image/webp'
    const extension = /image\/gif/i.test(mimeType) ? 'gif' : /image\/png/i.test(mimeType) ? 'png' : /image\/jpe?g/i.test(mimeType) ? 'jpg' : 'webp'
    const filename = `${this.fileStem(preferredName)}-${Date.now()}.${extension}`
    const form = new FormData()
    form.set('action', 'upload'); form.set('format', 'json'); form.set('formatversion', '2'); form.set('filename', filename)
    form.set('file', new Blob([bytes], { type: mimeType }), filename); form.set('token', await this.token()); form.set('ignorewarnings', '1')
    const response = await fetch(this.apiUrl, { method: 'POST', headers: this.cookie ? { cookie: this.cookie } : {}, body: form, signal: AbortSignal.timeout(30_000) })
    const data = await response.json() as { upload?: { result?: string; filename?: string }; error?: { info?: string } }
    if (!response.ok || data.error || data.upload?.result !== 'Success' || !data.upload.filename) throw new ServiceUnavailableException(data.error?.info ?? 'Upload MediaWiki impossible.')
    return data.upload.filename
  }
  private async login(): Promise<void> {
    if (!this.enabled()) {
      throw new ServiceUnavailableException('MediaWiki n’est pas configuré.')
    }

    // Repartir d'une session propre.
    this.cookie = ''

    const loginTokenResponse = await this.request({
      action: 'query',
      meta: 'tokens',
      type: 'login',
    }) as {
      query?: {
        tokens?: {
          logintoken?: string
        }
      }
    }

    const loginToken =
      loginTokenResponse.query?.tokens?.logintoken

    if (!loginToken) {
      throw new ServiceUnavailableException(
        'Token de connexion MediaWiki indisponible.',
      )
    }

    const login = await this.request({
      action: 'login',
      lgname: this.username,
      lgpassword: this.password,
      lgtoken: loginToken,
    }, 'POST') as {
      login?: {
        result?: string
        reason?: string
      }
    }

    if (login.login?.result !== 'Success') {
      throw new ServiceUnavailableException(
        login.login?.reason ??
          'Authentification MediaWiki refusée.',
      )
    }
  }

  private async isLoggedIn(): Promise<boolean> {
    if (!this.cookie) return false

    try {
      const data = await this.request({
        action: 'query',
        meta: 'userinfo',
      }) as {
        query?: {
          userinfo?: {
            id?: number
            anon?: boolean
          }
        }
      }

      const user = data.query?.userinfo

      return Boolean(
        user &&
        !user.anon &&
        Number(user.id ?? 0) > 0
      )
    } catch {
      return false
    }
  }

  private async token(): Promise<string> {
    if (!this.enabled()) {
      throw new ServiceUnavailableException(
        'MediaWiki n’est pas configuré.',
      )
    }

    if (!(await this.isLoggedIn())) {
      await this.login()
    }

    const csrf = await this.request({
      action: 'query',
      meta: 'tokens',
      type: 'csrf',
    }) as {
      query?: {
        tokens?: {
          csrftoken?: string
        }
      }
    }

    const token = csrf.query?.tokens?.csrftoken

    // "+\\" est le token CSRF typique d'une session anonyme.
    if (!token || token === '+\\') {
      // Une session a pu expirer entre userinfo et le token.
      await this.login()

      const retry = await this.request({
        action: 'query',
        meta: 'tokens',
        type: 'csrf',
      }) as {
        query?: {
          tokens?: {
            csrftoken?: string
          }
        }
      }

      const retryToken = retry.query?.tokens?.csrftoken

      if (!retryToken || retryToken === '+\\') {
        throw new ServiceUnavailableException(
          'Session MediaWiki non authentifiée.',
        )
      }

      return retryToken
    }

    return token
  }

  private async request(values: Record<string, string>, method: 'GET' | 'POST' = 'GET'): Promise<unknown> {
    if (!this.apiUrl) throw new ServiceUnavailableException('MediaWiki n’est pas configuré.')
    const body = new URLSearchParams({ format: 'json', formatversion: '2', ...values })
    const response = await fetch(method === 'GET' ? `${this.apiUrl}?${body}` : this.apiUrl, { method, headers: { ...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...(this.cookie ? { cookie: this.cookie } : {}) }, body: method === 'POST' ? body : undefined, signal: AbortSignal.timeout(15_000) })
    this.captureCookies(response)
    const data = await response.json() as { error?: { info?: string } }
    if (!response.ok || data.error) { this.logger.warn(`MediaWiki Action API: ${data.error?.info ?? response.status}`); throw new ServiceUnavailableException(data.error?.info ?? 'Erreur MediaWiki.') }
    return data
  }
  private captureCookies(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : []

    if (!setCookies.length) return

    const jar = new Map<string, string>()

    for (const current of this.cookie.split(/;\s*/)) {
      if (!current) continue

      const separator = current.indexOf('=')
      if (separator <= 0) continue

      jar.set(
        current.slice(0, separator),
        current.slice(separator + 1),
      )
    }

    for (const header of setCookies) {
      const cookie = header.split(';', 1)[0]
      const separator = cookie.indexOf('=')

      if (separator <= 0) continue

      const name = cookie.slice(0, separator)
      const value = cookie.slice(separator + 1)

      if (value) {
        jar.set(name, value)
      } else {
        jar.delete(name)
      }
    }

    this.cookie = [...jar.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  private fileStem(value: string): string { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'personnage' }
}
