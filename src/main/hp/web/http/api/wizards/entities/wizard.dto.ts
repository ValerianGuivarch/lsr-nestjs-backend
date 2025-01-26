import { WizardKnowledgeDto } from './wizard-knowledge.dto'
import { WizardSpellDto } from './wizard-spell.dto'
import { WizardStatDto } from './wizard-stat.dto'
import { Wizard, WizardName } from '../../../../../domain/entities/wizard.entity'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
    description: 'The wizard pv',
    type: Number
  })
  pv: number

  @ApiProperty({
    description: 'The wizard pvMax',
    type: Number
  })
  pvMax: number

  @ApiPropertyOptional({
    description: 'The wizard house',
    type: String
  })
  houseName?: string

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

  @ApiProperty({
    description: 'The wizard animal',
    type: String
  })
  animal: string

  @ApiProperty({
    description: 'The wizard traits',
    isArray: true,
    type: String
  })
  traits: string[]

  constructor(wizard: WizardDto) {
    this.name = wizard.name
    this.animal = wizard.animal
    this.familyName = wizard.familyName
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.xp = wizard.xp
    this.pv = wizard.pv
    this.pvMax = wizard.pvMax
    this.spells = wizard.spells
    this.houseName = wizard.houseName
    this.baguette = wizard.baguette
    this.coupDePouce = wizard.coupDePouce
    this.crochePatte = wizard.crochePatte
    this.text = wizard.text
    this.traits = wizard.traits
  }
  static from(wizard: Wizard): WizardDto {
    return new WizardDto({
      name: wizard.name,
      familyName: wizard.familyName,
      category: wizard.category,
      animal: wizard.animal,
      stats: wizard.stats.map(WizardStatDto.from),
      knowledges: wizard.knowledges.map(WizardKnowledgeDto.from),
      spells: wizard.spells.map(WizardSpellDto.from),
      xp: wizard.xp,
      pv: wizard.pv,
      pvMax: wizard.pvMax,
      houseName: wizard.house.name,
      baguette: wizard.baguette,
      coupDePouce: wizard.coupDePouce,
      crochePatte: wizard.crochePatte,
      text: wizard.text,
      traits: wizard.traits
    })
  }
}

export type WizardNameDto = Pick<WizardName, 'name'>
