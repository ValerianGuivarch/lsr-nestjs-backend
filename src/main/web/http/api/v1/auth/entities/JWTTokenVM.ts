import { JWTToken } from '../../../../../../domain/models/auth/JWTToken'
import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class JWTTokenVM {
  @ApiProperty()
  @IsString()
  accessToken: string

  @ApiProperty()
  @IsString()
  accessTokenExpiration: number

  @ApiProperty()
  @IsString()
  refreshToken: string

  @ApiProperty()
  @IsString()
  refreshTokenExpiration: number

  constructor(p: JWTTokenVM) {
    this.accessToken = p.accessToken
    this.accessTokenExpiration = p.accessTokenExpiration
    this.refreshToken = p.refreshToken
    this.refreshTokenExpiration = p.refreshTokenExpiration
  }

  static of(jwtToken: JWTToken): JWTTokenVM {
    return new JWTTokenVM({
      accessToken: jwtToken.accessToken,
      accessTokenExpiration: jwtToken.accessTokenExpiration,
      refreshToken: jwtToken.refreshToken,
      refreshTokenExpiration: jwtToken.refreshTokenExpiration
    })
  }
}
