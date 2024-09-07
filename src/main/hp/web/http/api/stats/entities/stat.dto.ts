import { Stat } from '../../../../../domain/entities/stat.entity'
import { ApiProperty } from '@nestjs/swagger'

export class StatDto {
  @ApiProperty({
    description: 'The stat name',
    type: String
  })
  name: string

  constructor(stat: StatDto) {
    this.name = stat.name
  }
  static from(stat: Stat): StatDto {
    return new StatDto({
      name: stat.name
    })
  }
}
