import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  displayCategory: string

  constructor(p: SkillVM) {
    this.name = p.name
    this.displayCategory = p.displayCategory
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      displayCategory: p.skill.displayCategory.toString()
    })
  }
}
