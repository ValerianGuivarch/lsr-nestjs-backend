import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateFlipRequest {
  @ApiProperty({ description: 'The wizard id', type: String })
  @IsString()
  wizardId: string

  @ApiPropertyOptional({ description: 'The knowledge id', type: String })
  @IsString()
  knowledgeId?: string

  @ApiPropertyOptional({ description: 'The stat id', type: String })
  @IsString()
  statId?: string
}
