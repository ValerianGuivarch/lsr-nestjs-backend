import { Bloodline } from '../../../../../../domain/models/characters/Bloodline'
import { ApiProperty } from '@nestjs/swagger'

export class BloodlineVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  display: string

  constructor(p: BloodlineVM) {
    this.name = p.name
    this.display = p.display
  }

  static of(p: { bloodline: Bloodline }): BloodlineVM {
    return new BloodlineVM({
      name: p.bloodline.name,
      display: p.bloodline.display
    })
  }
}
