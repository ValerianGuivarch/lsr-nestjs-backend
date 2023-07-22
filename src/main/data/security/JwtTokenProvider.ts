import { Authentication } from '../../domain/models/auth/Authentication'
import { Authority } from '../../domain/models/auth/Authority'
import { JWTToken } from '../../domain/models/auth/JWTToken'
import { ITokenProvider } from '../../domain/providers/ITokenProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { TokenExpiredError } from 'jsonwebtoken'

@Injectable()
export class JwtTokenProvider implements ITokenProvider {
  private readonly jwtSecret: string

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret')
    console.log('JwtTokenProvider')
  }

  async generateTokens(p: {
    accountId: string
    authority: Authority
    secret: string
  }): Promise<JWTToken> {
    const expirationAccess = 86_400 // 1 day
    const expirationRefresh = 2_592_000 // 30 days
    const accessToken = this.jwtService.sign(
      { authority: p.authority },
      {
        privateKey: this.jwtSecret + p.secret,
        expiresIn: expirationAccess,
        subject: p.accountId.toString(),
      }
    )
    const refreshToken = this.jwtService.sign(
      { authority: p.authority },
      {
        privateKey: this.jwtSecret + p.secret,
        expiresIn: expirationRefresh,
        subject: p.accountId.toString(),
      }
    )
    const today = new Date()
    return new JWTToken({
      accessToken: accessToken,
      accessTokenExpirationDate: new Date(
        // eslint-disable-next-line no-magic-numbers
        today.getTime() + 1_000 * expirationAccess
      ),
      refreshToken: refreshToken,
      refreshTokenExpirationDate: new Date(
        // eslint-disable-next-line no-magic-numbers
        today.getTime() + 1_000 * expirationRefresh
      ),
      authority: p.authority,
    })
  }

  async unpackToken(token: string): Promise<Authentication> {
    const token2 = this.jwtService.decode(token)
    if (!token2) {
      throw ProviderErrors.WrongToken()
    }
    if (typeof token2 === 'object') {
      return new Authentication({
        authority: token2.authority,
        issuedAt: new Date(token2.iat ?? 0),
        expiresAt: new Date(token2.exp ?? 0),
        subject: token2.sub ?? '',
        isRefreshToken: 'accessToken' in token2,
      })
    }
    throw ProviderErrors.WrongToken()
  }

  async verifyToken(accessToken: string, secret: string): Promise<void> {
    try {
      await this.jwtService.verify(accessToken, {
        secret: this.jwtSecret + secret,
      })
      return
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw ProviderErrors.ExpiredToken()
      }
    }
    throw ProviderErrors.WrongToken()
  }
}
