import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  shortName: string

  @ApiPropertyOptional()
  longName?: string

  @ApiProperty()
  displayCategory: string

  @ApiProperty({ default: '' })
  description: string

  @ApiProperty()
  dailyUse: number | null

  constructor(p: SkillVM) {
    this.name = p.name
    this.shortName = p.shortName
    this.longName = p.longName
    this.displayCategory = p.displayCategory
    this.description = p.description
    this.dailyUse = p.dailyUse
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      dailyUse: p.skill.dailyUse,
      shortName: p.skill.shortName,
      longName: p.skill.longName,
      displayCategory: p.skill.displayCategory.toString(),
      description: p.skill.description
    })
  }
}
