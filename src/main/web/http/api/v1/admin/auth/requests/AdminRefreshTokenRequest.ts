import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AdminRefreshTokenRequest {
  @ApiProperty()
  @IsString()
  readonly refreshToken: string
}
