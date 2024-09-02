import { WizardKnowledgeDto } from './wizard-knowledge.dto'
import { WizardStatDto } from './wizard-stat.dto'
import { Category } from '../../../../../domain/entities/category.enum'
import { Wizard, WizardName } from '../../../../../domain/entities/wizard.entity'
import { ApiProperty } from '@nestjs/swagger'

export class WizardDto {
  @ApiProperty({
    description: 'The wizard uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The wizard name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The wizard category',
    enum: Category,
    enumName: 'Category'
  })
  category: Category

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

  constructor(wizard: WizardDto) {
    this.id = wizard.id
    this.name = wizard.name
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
  }
  static from(wizard: Wizard): WizardDto {
    return new WizardDto({
      id: wizard.id,
      name: wizard.name,
      category: wizard.category,
      stats: wizard.stats.map(WizardStatDto.from),
      knowledges: wizard.knowledges.map(WizardKnowledgeDto.from)
    })
  }
}

export type WizardNameDto = Pick<WizardName, 'id' | 'name'>
