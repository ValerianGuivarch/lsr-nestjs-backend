import { House } from '../../../../../domain/entities/house.entity'
import { ApiProperty } from '@nestjs/swagger'

export class HouseDto {
  @ApiProperty({
    description: 'The house name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The house points',
    type: Number
  })
  points: number

  constructor(house: HouseDto) {
    this.name = house.name
    this.points = house.points
  }
  static from(house: House): HouseDto {
    return new HouseDto({
      name: house.name,
      points: house.points
    })
  }
}
