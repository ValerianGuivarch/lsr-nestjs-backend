import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  displayCategory: string

  @ApiProperty()
  position: number

  constructor(p: SkillVM) {
    this.name = p.name
    this.displayCategory = p.displayCategory
    this.position = p.position
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      displayCategory: p.skill.displayCategory.toString(),
      position: p.skill.position
    })
  }
}
