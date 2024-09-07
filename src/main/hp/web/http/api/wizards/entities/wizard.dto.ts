import { WizardKnowledgeDto } from './wizard-knowledge.dto'
import { WizardSpellDto } from './wizard-spell.dto'
import { WizardStatDto } from './wizard-stat.dto'
import { Wizard, WizardName } from '../../../../../domain/entities/wizard.entity'
import { ApiProperty } from '@nestjs/swagger'

export class WizardDto {
  @ApiProperty({
    description: 'The wizard name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The wizard category',
    type: String
  })
  category: string

  @ApiProperty({
    description: 'All wizard stats',
    isArray: true,
    type: WizardStatDto
  })
  stats: WizardStatDto[]

  @ApiProperty({
    description: 'All wizard skills',
    isArray: true,
    type: WizardKnowledgeDto
  })
  knowledges: WizardKnowledgeDto[]

  @ApiProperty({
    description: 'All wizard spells',
    isArray: true,
    type: WizardSpellDto
  })
  spells: WizardSpellDto[]

  @ApiProperty({
    description: 'The wizard xp',
    type: Number
  })
  xp: number

  constructor(wizard: WizardDto) {
    this.name = wizard.name
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.xp = wizard.xp
    this.spells = wizard.spells
  }
  static from(wizard: Wizard): WizardDto {
    return new WizardDto({
      name: wizard.name,
      category: wizard.category,
      stats: wizard.stats.map(WizardStatDto.from),
      knowledges: wizard.knowledges.map(WizardKnowledgeDto.from),
      spells: wizard.spells.map(WizardSpellDto.from),
      xp: wizard.xp
    })
  }
}

export type WizardNameDto = Pick<WizardName, 'name'>
