import { Apotheose } from '../../../../../../domain/models/apotheoses/Apotheose'
import { ApiProperty } from '@nestjs/swagger'

export class ApotheoseVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  shortName: string

  @ApiProperty()
  displayCategory: string

  @ApiProperty()
  cost: number

  constructor(p: ApotheoseVM) {
    this.name = p.name
    this.shortName = p.shortName
    this.displayCategory = p.displayCategory
    this.cost = p.cost
  }

  static of(p: { apotheose: Apotheose }): ApotheoseVM {
    return new ApotheoseVM({
      name: p.apotheose.name,
      shortName: p.apotheose.shortName,
      displayCategory: p.apotheose.displayCategory.toString(),
      cost: p.apotheose.cost
    })
  }
}
