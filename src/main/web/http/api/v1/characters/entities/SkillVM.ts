import { Character } from '../../../../../../domain/models/characters/Character'
import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SkillVM {
  @ApiProperty()
  id: string

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
  dailyUseMax: number | null

  @ApiProperty()
  dailyUse: number | null

  @ApiProperty()
  soldatCost: number

  @ApiProperty()
  isHeal: boolean

  constructor(p: SkillVM) {
    this.id = p.id
    this.name = p.name
    this.shortName = p.shortName
    this.longName = p.longName
    this.displayCategory = p.displayCategory
    this.description = p.description
    this.dailyUse = p.dailyUse
    this.dailyUseMax = p.dailyUseMax
    this.soldatCost = p.soldatCost
    this.isHeal = p.isHeal
  }

  static of(p: { skill: Skill; character: Character }): SkillVM {
    return new SkillVM({
      id: p.skill.id,
      name: p.skill.name,
      dailyUse: p.character.dailyUse[p.skill.name],
      dailyUseMax: p.character.dailyUseMax[p.skill.name],
      shortName: p.skill.shortName,
      longName: p.skill.longName,
      displayCategory: p.skill.displayCategory.toString(),
      description: p.skill.description,
      soldatCost: p.skill.soldatCost,
      isHeal: p.skill.isHeal
    })
  }
}
