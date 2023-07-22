import { Authority } from '../../../../../../../domain/models/auth/Authority'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'

export class AdminCreateAccountRequest {
  @IsString()
  @ApiProperty()
  readonly email: string

  @IsString()
  @ApiProperty()
  readonly password: string

  @IsEnum(Authority)
  @ApiProperty({ isArray: true, enum: Authority, enumName: 'Authority', example: Object.values(Authority) })
  readonly authority: Authority
}
