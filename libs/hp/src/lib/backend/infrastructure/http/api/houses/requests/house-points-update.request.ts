import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'

export class HousePointsUpdateRequest {
  @ApiProperty({ description: 'House points value', type: Number })
  @IsNumber()
  points: number
}

export class HousesPointsUpdateRequest {
  @ApiProperty({
    description: 'Points by house name',
    type: Object,
    example: {
      Gryffondor: 50,
      Serdaigle: 40,
      Poufsouffle: 60,
      Serpentard: 30
    }
  })
  pointsByHouse: Record<string, number>
}
