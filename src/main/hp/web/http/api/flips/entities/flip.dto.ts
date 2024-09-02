import { Flip } from '../../../../../domain/entities/flip.entity'
import { ApiProperty } from '@nestjs/swagger'

export class FlipDto {
  @ApiProperty({
    description: 'The flip uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The flip wizardName',
    type: String
  })
  wizardName: string

  @ApiProperty({
    description: 'The flip text',
    type: String
  })
  text: string

  constructor(flip: FlipDto) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.text = flip.text
  }
  static from(flip: Flip): FlipDto {
    return new FlipDto({
      id: flip.id,
      wizardName: flip.wizardName,
      text: flip.text
    })
  }
}
