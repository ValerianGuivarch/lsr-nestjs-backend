import { Difficulty } from '../../../../../domain/entities/difficulty.enum'
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
    description: 'The flip baseBis',
    type: Number
  })
  baseBis: number

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

  @ApiProperty({
    description: 'The flip difficulty',
    enumName: 'Difficulty'
  })
  difficulty: Difficulty

  @ApiProperty({
    description: 'The flip success',
    type: Boolean
  })
  success: boolean

  @ApiProperty({
    description: 'The flip xpOk',
    type: Boolean
  })
  xpOk: boolean

  constructor(flip: FlipDto) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.text = flip.text
    this.result = flip.result
    this.base = flip.base
    this.modif = flip.modif
    this.baseBis = flip.baseBis
    this.difficulty = flip.difficulty
    this.success = flip.success
    this.xpOk = flip.xpOk
  }
  static from(flip: Flip): FlipDto {
    return new FlipDto({
      id: flip.id,
      wizardName: flip.wizardName,
      xpOk: flip.xpOk,
      text: flip.text,
      result: flip.result,
      base: flip.base,
      modif: flip.modif,
      baseBis: flip.baseBis,
      difficulty: flip.difficulty,
      success: flip.success
    })
  }
}
