import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsString } from 'class-validator'

export class CreateWizardKnowledgeRequest {
  @ApiProperty({ description: 'The knowledge name', type: String, format: 'varchar' })
  @IsDefined()
  @IsString()
  name: string

  @ApiProperty({ description: 'The knowledge level', type: Number, format: 'int32' })
  @IsDefined()
  level: number
}
