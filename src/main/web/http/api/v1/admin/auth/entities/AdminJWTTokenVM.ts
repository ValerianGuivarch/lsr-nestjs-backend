import { Authority } from '../../../../../../../domain/models/auth/Authority'
import { JWTToken } from '../../../../../../../domain/models/auth/JWTToken'
import { ApiProperty } from '@nestjs/swagger'

export class AdminJWTTokenVM {
  @ApiProperty()
  accessToken: string

  @ApiProperty()
  accessTokenExpiration: number

  @ApiProperty()
  refreshToken: string

  @ApiProperty()
  refreshTokenExpiration: number

  @ApiProperty({ isArray: true, enum: Authority, enumName: 'Authority', example: Object.values(Authority) })
  authority: Authority

  constructor(p: JWTToken) {
    this.accessToken = p.accessToken
    this.accessTokenExpiration = p.accessTokenExpiration
    this.refreshToken = p.refreshToken
    this.refreshTokenExpiration = p.refreshTokenExpiration
    this.authority = p.authority
  }

  static of(jwtToken: JWTToken): AdminJWTTokenVM {
    return new AdminJWTTokenVM({
      accessToken: jwtToken.accessToken,
      accessTokenExpiration: jwtToken.accessTokenExpiration,
      refreshToken: jwtToken.refreshToken,
      refreshTokenExpiration: jwtToken.refreshTokenExpiration,
      authority: jwtToken.authority
    })
  }
}
