import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateMessageRequest {
  @ApiProperty({
    description: 'The message text',
    type: String
  })
  @IsString()
  text: string

  @ApiProperty({
    description: 'The message sender',
    type: String,
    format: 'uuid'
  })
  @IsString()
  senderId: string
}

export const CreateMessageRequestExample: CreateMessageRequest = {
  text: 'Message',
  senderId: 'Constellation'
}
