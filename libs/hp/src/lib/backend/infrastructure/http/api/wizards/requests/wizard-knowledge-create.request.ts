import { ApiProperty } from '@nestjs/swagger'
import { IsDefined } from 'class-validator'

export class CreateWizardKnowledgeRequest {
  @ApiProperty({ description: 'The knowledge name', type: String, format: 'varchar' })
  name: string

  @ApiProperty({ description: 'The knowledge level', type: Number, format: 'int32' })
  @IsDefined()
  level: number
}
