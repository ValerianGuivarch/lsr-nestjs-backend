import { Stat } from '../../../../../domain/entities/stat.entity'
import { ApiProperty } from '@nestjs/swagger'

export class StatDto {
  @ApiProperty({
    description: 'The stat uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The stat name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The stat color',
    type: String
  })
  color: string

  constructor(stat: StatDto) {
    this.id = stat.id
    this.name = stat.name
    this.color = stat.color
  }
  static from(stat: Stat): StatDto {
    return new StatDto({
      id: stat.id,
      name: stat.name,
      color: stat.color
    })
  }
}
