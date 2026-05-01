import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class SendEntriesRequest {
  @ApiProperty()
  @IsString()
  readonly text: string
}
