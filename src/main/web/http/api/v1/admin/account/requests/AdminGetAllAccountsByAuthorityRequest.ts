import { Authority } from '../../../../../../../domain/models/auth/Authority'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class AdminGetAllAccountsByAuthorityRequest {
  @IsEnum(Authority)
  @ApiProperty({ isArray: true, enum: Authority, enumName: 'Authority', example: Object.values(Authority) })
  readonly authority: Authority
}
