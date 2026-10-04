import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

interface SessionPayload {
  exp: number
  nonce: string
}

interface FailureWindow {
  count: number
  resetAt: number
}

@Injectable()
export class AuthService {
  readonly cookieName = 'l7r_recalbox_session'
  readonly sessionTtlSeconds = 12 * 60 * 60

  private readonly failures = new Map<string, FailureWindow>()
  private readonly maxAttempts = 5
  private readonly failureWindowMs = 10 * 60 * 1000

  authenticate(password: string, clientId: string): string {
    this.assertLoginAllowed(clientId)

    if (!this.safeEqual(password, this.requiredEnv('RECALBOX_WEB_PASSWORD'))) {
      this.recordFailure(clientId)
      throw new UnauthorizedException('Mot de passe incorrect')
    }

    this.failures.delete(clientId)
    return this.createSessionToken()
  }

  verifySession(token: string | undefined): boolean {
    if (!token) return false

    const separator = token.lastIndexOf('.')
    if (separator <= 0) return false

    const encodedPayload = token.slice(0, separator)
    const suppliedSignature = token.slice(separator + 1)
    const expectedSignature = this.sign(encodedPayload)

    if (!this.safeEqual(suppliedSignature, expectedSignature)) return false

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload
      return Number.isFinite(payload.exp) && payload.exp > Date.now() && typeof payload.nonce === 'string'
    } catch {
      return false
    }
  }

  sessionFromCookie(cookieHeader: string | undefined): string | undefined {
    if (!cookieHeader) return undefined

    for (const part of cookieHeader.split(';')) {
      const [rawName, ...rawValue] = part.trim().split('=')
      if (rawName === this.cookieName) {
        return decodeURIComponent(rawValue.join('='))
      }
    }

    return undefined
  }

  createSessionCookie(token: string): string {
    return [
      `${this.cookieName}=${encodeURIComponent(token)}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/recalbox',
      `Max-Age=${this.sessionTtlSeconds}`,
      ...(process.env['NODE_ENV'] === 'production' ? ['Secure'] : [])
    ].join('; ')
  }

  createClearedSessionCookie(): string {
    return [
      `${this.cookieName}=`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/recalbox',
      'Max-Age=0',
      ...(process.env['NODE_ENV'] === 'production' ? ['Secure'] : [])
    ].join('; ')
  }

  private createSessionToken(): string {
    const payload: SessionPayload = {
      exp: Date.now() + this.sessionTtlSeconds * 1000,
      nonce: randomBytes(16).toString('hex')
    }
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${encodedPayload}.${this.sign(encodedPayload)}`
  }

  private sign(value: string): string {
    return createHmac('sha256', this.requiredEnv('RECALBOX_SESSION_SECRET')).update(value).digest('base64url')
  }

  private safeEqual(left: string, right: string): boolean {
    const leftDigest = createHash('sha256').update(left).digest()
    const rightDigest = createHash('sha256').update(right).digest()
    return timingSafeEqual(leftDigest, rightDigest)
  }

  private requiredEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
      throw new ServiceUnavailableException(`${name} is not configured`)
    }
    return value
  }

  private assertLoginAllowed(clientId: string): void {
    const now = Date.now()
    const current = this.failures.get(clientId)
    if (!current || current.resetAt <= now) {
      this.failures.delete(clientId)
      return
    }

    if (current.count >= this.maxAttempts) {
      throw new HttpException('Trop de tentatives. Réessaie dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS)
    }
  }

  private recordFailure(clientId: string): void {
    const now = Date.now()
    const current = this.failures.get(clientId)

    if (!current || current.resetAt <= now) {
      this.failures.set(clientId, { count: 1, resetAt: now + this.failureWindowMs })
      return
    }

    current.count += 1
    this.failures.set(clientId, current)
  }
}
