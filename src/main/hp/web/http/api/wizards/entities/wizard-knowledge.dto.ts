import { WizardKnowledge } from '../../../../../domain/entities/wizard-knowledge.entity'
import { KnowledgeDto } from '../../knowledges/entities/knowledge.dto'
import { ApiProperty } from '@nestjs/swagger'

export class WizardKnowledgeDto {
  @ApiProperty({ description: 'The wizard knowledge level', type: Number })
  level: number

  @ApiProperty({ description: 'The knowledge', type: KnowledgeDto })
  knowledge: KnowledgeDto

  @ApiProperty({ description: 'The wizard knowledge xp', type: Number })
  xp: number

  constructor(wizardKnowledge: WizardKnowledgeDto) {
    this.level = wizardKnowledge.level
    this.knowledge = wizardKnowledge.knowledge
    this.xp = wizardKnowledge.xp
  }

  static from(wizardKnowledge: WizardKnowledge): WizardKnowledgeDto {
    return new WizardKnowledgeDto({
      level: wizardKnowledge.level,
      knowledge: wizardKnowledge.knowledge,
      xp: wizardKnowledge.xp
    })
  }
}
