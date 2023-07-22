import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RefreshTokenRequest {
  @IsString()
  @ApiProperty()
  readonly refreshToken: string
}
