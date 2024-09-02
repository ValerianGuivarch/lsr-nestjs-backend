import { CreateWizardKnowledgeRequest } from './wizard-knowledge-create.request'
import { CreateWizardStatRequest } from './wizard-stat-create.request'
import { Category } from '../../../../../domain/entities/category.enum'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDefined, IsString, ValidateNested } from 'class-validator'

export class CreateWizardRequest {
  @ApiProperty({ description: 'The wizard name', type: String })
  @IsString()
  name: string

  @ApiProperty({ description: 'The wizard category', enum: Category, enumName: 'Category' })
  @IsDefined()
  category: Category

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
}
