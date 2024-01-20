import { ConstellationVM, ConstellationVMExample } from './ConstellationVM'
import { Constellation } from '../../../../../../domain/models/elena/Constellation'
import { Message } from '../../../../../../domain/models/elena/Message'
import { ApiProperty } from '@nestjs/swagger'

export class MessageVM {
  @ApiProperty({
    description: 'The message uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The message content',
    type: String
  })
  text: string

  @ApiProperty({
    description: 'The message sender',
    type: Constellation
  })
  sender: ConstellationVM

  constructor(message: MessageVM) {
    this.id = message.id
    this.text = message.text
    this.sender = message.sender
  }

  static fromMessage(message: Message): MessageVM {
    return new MessageVM({
      id: message.id,
      text: message.text,
      sender: ConstellationVM.fromConstellation(message.sender)
    })
  }
}

export const MessageVMExample: MessageVM = {
  id: 'uuid',
  text: 'Message',
  sender: ConstellationVMExample
}
