import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class WsCharacterRequest {
  @ApiProperty()
  @IsString()
  name: string
}
