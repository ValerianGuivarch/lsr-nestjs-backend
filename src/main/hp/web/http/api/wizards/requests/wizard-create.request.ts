import { CreateWizardKnowledgeRequest } from './wizard-knowledge-create.request'
import { CreateWizardSpellRequest } from './wizard-spell-create.request'
import { CreateWizardStatRequest } from './wizard-stat-create.request'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator'

export class CreateWizardRequest {
  @ApiProperty({ description: 'The wizard name', type: String })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'The wizard family name', type: String })
  @IsString()
  @IsOptional()
  familyName?: string

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

  @ApiPropertyOptional({ description: 'The house name', type: String })
  @IsString()
  @IsOptional()
  houseName?: string
}
