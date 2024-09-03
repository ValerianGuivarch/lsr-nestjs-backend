import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsUUID } from 'class-validator'

export class CreateWizardKnowledgeRequest {
  @ApiProperty({ description: 'The class ID', type: String, format: 'uuid' })
  @IsUUID()
  id: string

  @ApiProperty({ description: 'The knowledge level', type: Number, format: 'int32' })
  @IsDefined()
  level: number
}
