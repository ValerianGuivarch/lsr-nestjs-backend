import { Proficiency } from '../../../../../../domain/models/proficiencies/Proficiency'
import { ApiProperty } from '@nestjs/swagger'

export class ProficiencyVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  shortName: string

  @ApiProperty()
  displayCategory: string

  constructor(p: ProficiencyVM) {
    this.name = p.name
    this.shortName = p.shortName
    this.displayCategory = p.displayCategory
  }

  static of(p: { proficiency: Proficiency }): ProficiencyVM {
    return new ProficiencyVM({
      name: p.proficiency.name,
      shortName: p.proficiency.shortName,
      displayCategory: p.proficiency.displayCategory.toString()
    })
  }
}