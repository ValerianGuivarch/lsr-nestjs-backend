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

  @ApiProperty({
    description: 'The flip result',
    type: Number
  })
  result: number

  @ApiProperty({
    description: 'The flip modif',
    type: Number
  })
  modif: number

  @ApiProperty({
    description: 'The flip result',
    type: Number
  })
  base: number

  constructor(flip: FlipDto) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.text = flip.text
    this.result = flip.result
    this.base = flip.base
    this.modif = flip.modif
  }
  static from(flip: Flip): FlipDto {
    return new FlipDto({
      id: flip.id,
      wizardName: flip.wizardName,
      text: flip.text,
      result: flip.result,
      base: flip.base,
      modif: flip.modif
    })
  }
}
