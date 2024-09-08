import { WizardKnowledgeDto } from './wizard-knowledge.dto'
import { WizardSpellDto } from './wizard-spell.dto'
import { WizardStatDto } from './wizard-stat.dto'
import { House } from '../../../../../domain/entities/house.entity'
import { Wizard, WizardName } from '../../../../../domain/entities/wizard.entity'
import { ApiProperty } from '@nestjs/swagger'

export class WizardDto {
  @ApiProperty({
    description: 'The wizard name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The wizard family name',
    type: String
  })
  familyName: string

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

  @ApiProperty({
    description: 'The wizard house',
    type: House
  })
  house?: House

  @ApiProperty({
    description: 'The wizard baguette',
    type: String
  })
  baguette: string

  @ApiProperty({
    description: 'The wizard coup de pouce',
    type: String
  })
  coupDePouce: string

  @ApiProperty({
    description: 'The wizard croche patte',
    type: String
  })
  crochePatte: string

  @ApiProperty({
    description: 'The wizard text',
    type: String
  })
  text: string

  constructor(wizard: WizardDto) {
    this.name = wizard.name
    this.familyName = wizard.familyName
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.xp = wizard.xp
    this.spells = wizard.spells
    this.house = wizard.house
    this.baguette = wizard.baguette
    this.coupDePouce = wizard.coupDePouce
    this.crochePatte = wizard.crochePatte
    this.text = wizard.text
  }
  static from(wizard: Wizard): WizardDto {
    return new WizardDto({
      name: wizard.name,
      familyName: wizard.familyName,
      category: wizard.category,
      stats: wizard.stats.map(WizardStatDto.from),
      knowledges: wizard.knowledges.map(WizardKnowledgeDto.from),
      spells: wizard.spells.map(WizardSpellDto.from),
      xp: wizard.xp,
      house: wizard.house,
      baguette: wizard.baguette,
      coupDePouce: wizard.coupDePouce,
      crochePatte: wizard.crochePatte,
      text: wizard.text
    })
  }
}

export type WizardNameDto = Pick<WizardName, 'name'>
