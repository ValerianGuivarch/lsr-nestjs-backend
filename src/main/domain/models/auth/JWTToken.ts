import { Authority } from './Authority'

export class JWTToken {
  accessToken: string
  accessTokenExpiration: number
  refreshToken: string
  refreshTokenExpiration: number
  authority: Authority

  constructor(p: {
    accessToken: string
    accessTokenExpirationDate: Date
    refreshToken: string
    refreshTokenExpirationDate: Date
    authority: Authority
  }) {
    this.accessToken = p.accessToken
    // eslint-disable-next-line no-magic-numbers
    this.accessTokenExpiration = Math.round(p.accessTokenExpirationDate.getTime() / 1000)

    this.refreshToken = p.refreshToken
    // eslint-disable-next-line no-magic-numbers
    this.refreshTokenExpiration = Math.round(p.refreshTokenExpirationDate.getTime() / 1000)
    this.authority = p.authority
  }
}
