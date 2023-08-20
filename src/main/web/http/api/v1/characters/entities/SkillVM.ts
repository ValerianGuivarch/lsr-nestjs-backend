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
  limitationMax: number | null

  @ApiProperty()
  dailyUse: number | null

  @ApiProperty()
  soldatCost: number

  constructor(p: SkillVM) {
    this.name = p.name
    this.shortName = p.shortName
    this.longName = p.longName
    this.displayCategory = p.displayCategory
    this.description = p.description
    this.dailyUse = p.dailyUse
    this.limitationMax = p.limitationMax
    this.soldatCost = p.soldatCost
  }

  static of(p: { skill: Skill }): SkillVM {
    return new SkillVM({
      name: p.skill.name,
      dailyUse: p.skill.dailyUse,
      limitationMax: p.skill.limitationMax,
      shortName: p.skill.shortName,
      longName: p.skill.longName,
      displayCategory: p.skill.displayCategory.toString(),
      description: p.skill.description,
      soldatCost: p.skill.soldatCost
    })
  }
}
