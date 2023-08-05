import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  category: string

  constructor(p: SkillVM) {
    this.name = p.name
    this.category = p.category
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      category: p.skill.category.toString()
    })
  }
}
