import { Authority } from '../../../../../../../domain/models/auth/Authority'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class AdminAccountUpdateRequest {
  @ApiProperty({ isArray: true, enum: Authority, enumName: 'Authority', example: Object.values(Authority) })
  @IsEnum(Authority)
  readonly authority: Authority
}
