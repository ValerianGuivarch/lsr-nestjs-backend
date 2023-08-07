import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  category: string

  @ApiProperty()
  position: number

  constructor(p: SkillVM) {
    this.name = p.name
    this.category = p.category
    this.position = p.position
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      category: p.skill.category.toString(),
      position: p.skill.position
    })
  }
}
