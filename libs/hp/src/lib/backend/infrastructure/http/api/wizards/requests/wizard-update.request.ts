import { CreateWizardKnowledgeRequest } from './wizard-knowledge-create.request'
import { CreateWizardSpellRequest } from './wizard-spell-create.request'
import { CreateWizardStatRequest } from './wizard-stat-create.request'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'

export class UpdateWizardRequest {
  @ApiPropertyOptional({ description: 'The wizard category', type: String })
  @IsOptional()
  category?: string

  @ApiPropertyOptional({ description: 'All wizard stats', isArray: true, type: CreateWizardStatRequest })
  @IsOptional()
  @Type(() => CreateWizardStatRequest)
  @ValidateNested({ each: true })
  stats?: CreateWizardStatRequest[]

  @ApiPropertyOptional({ description: 'All wizard knowledges', isArray: true, type: CreateWizardKnowledgeRequest })
  @IsOptional()
  @Type(() => CreateWizardKnowledgeRequest)
  @ValidateNested({ each: true })
  knowledges?: CreateWizardKnowledgeRequest[]

  @ApiPropertyOptional({ description: 'All wizard spells', isArray: true, type: CreateWizardSpellRequest })
  @IsOptional()
  @Type(() => CreateWizardSpellRequest)
  @ValidateNested({ each: true })
  spells?: CreateWizardSpellRequest[]

  @ApiPropertyOptional({ description: 'The wizard text', type: String })
  @IsOptional()
  text?: string

  @ApiPropertyOptional({ description: 'The wizard pv', type: Number })
  @IsOptional()
  pv: number
}
