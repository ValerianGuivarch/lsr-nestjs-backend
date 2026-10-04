import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  const previousPassword = process.env['RECALBOX_WEB_PASSWORD']
  const previousSecret = process.env['RECALBOX_SESSION_SECRET']

  beforeEach(() => {
    process.env['RECALBOX_WEB_PASSWORD'] = 'test-password'
    process.env['RECALBOX_SESSION_SECRET'] = 'test-session-secret'
  })

  afterAll(() => {
    if (previousPassword === undefined) delete process.env['RECALBOX_WEB_PASSWORD']
    else process.env['RECALBOX_WEB_PASSWORD'] = previousPassword

    if (previousSecret === undefined) delete process.env['RECALBOX_SESSION_SECRET']
    else process.env['RECALBOX_SESSION_SECRET'] = previousSecret
  })

  it('creates and validates a session for the correct password', () => {
    const service = new AuthService()
    const token = service.authenticate('test-password', 'client-a')

    expect(service.verifySession(token)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const service = new AuthService()

    expect(() => service.authenticate('wrong', 'client-b')).toThrow(UnauthorizedException)
  })

  it('rejects a modified session token', () => {
    const service = new AuthService()
    const token = service.authenticate('test-password', 'client-c')

    expect(service.verifySession(`${token}x`)).toBe(false)
  })
})
