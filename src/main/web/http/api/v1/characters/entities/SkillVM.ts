import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  shortName: string

  @ApiProperty()
  displayCategory: string

  @ApiProperty()
  description: string

  constructor(p: SkillVM) {
    this.name = p.name
    this.shortName = p.shortName
    this.displayCategory = p.displayCategory
    this.description = p.description
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      shortName: p.skill.shortName,
      displayCategory: p.skill.displayCategory.toString(),
      description: p.skill.description
    })
  }
}
