import { CreateWizardKnowledgeRequest } from './wizard-knowledge-create.request'
import { CreateWizardSpellRequest } from './wizard-spell-create.request'
import { CreateWizardStatRequest } from './wizard-stat-create.request'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDefined, ValidateNested } from 'class-validator'

export class UpdateWizardRequest {
  @ApiProperty({ description: 'The wizard category', type: String })
  @IsDefined()
  category: string

  @ApiProperty({ description: 'All wizard stats', isArray: true, type: CreateWizardStatRequest })
  @IsDefined()
  @Type(() => CreateWizardStatRequest)
  @ValidateNested({ each: true })
  stats: CreateWizardStatRequest[]

  @ApiProperty({ description: 'All wizard knowledges', isArray: true, type: CreateWizardKnowledgeRequest })
  @IsDefined()
  @Type(() => CreateWizardKnowledgeRequest)
  @ValidateNested({ each: true })
  knowledges: CreateWizardKnowledgeRequest[]

  @ApiProperty({ description: 'All wizard spells', isArray: true, type: CreateWizardSpellRequest })
  @IsDefined()
  @Type(() => CreateWizardSpellRequest)
  @ValidateNested({ each: true })
  spells: CreateWizardSpellRequest[]

  @ApiPropertyOptional({ description: 'The wizard text', type: String })
  text?: string
}
