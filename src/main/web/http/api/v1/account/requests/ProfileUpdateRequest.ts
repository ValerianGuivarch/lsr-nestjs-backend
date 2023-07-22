import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ProfileUpdateRequest {
  @ApiProperty()
  @IsString()
  readonly name: string
}
