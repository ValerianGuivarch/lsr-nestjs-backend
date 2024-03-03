import { Constellation } from '../../../../../../domain/models/elena/Constellation'
import { ApiProperty } from '@nestjs/swagger'

export class ConstellationVM {
  @ApiProperty({
    description: 'The constellation uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The constellation picture',
    type: String
  })
  pictureUrl: string

  @ApiProperty({
    description: 'The constellation picture revealed',
    type: String
  })
  pictureUrlRevealed: string

  @ApiProperty({
    description: 'The constellation revealed',
    type: Boolean
  })
  revealed: boolean

  @ApiProperty({
    description: 'The constellation name',
    type: String
  })
  name: string
  isSponsor: boolean

  constructor(constellation: ConstellationVM) {
    this.id = constellation.id
    this.pictureUrl = constellation.pictureUrl
    this.pictureUrlRevealed = constellation.pictureUrlRevealed
    this.revealed = constellation.revealed
    this.name = constellation.name
    this.isSponsor = constellation.isSponsor
  }

  static fromConstellation(constellation: Constellation): ConstellationVM {
    return new ConstellationVM({
      id: constellation.id,
      pictureUrl: constellation.pictureUrl,
      name: constellation.name,
      pictureUrlRevealed: constellation.pictureUrlRevealed,
      revealed: constellation.revealed,
      isSponsor: constellation.sponsor
    })
  }
}

export const ConstellationVMExample: ConstellationVM = {
  id: 'uuid',
  pictureUrl: 'https://www.google.com',
  pictureUrlRevealed: 'https://www.google.com',
  revealed: false,
  name: 'Constellation',
  isSponsor: false
}
