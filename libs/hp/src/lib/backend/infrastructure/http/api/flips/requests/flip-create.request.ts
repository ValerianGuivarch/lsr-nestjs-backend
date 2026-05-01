import { Difficulty } from '../../../../../domain/entities/difficulty.enum'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class CreateFlipRequest {
  @ApiProperty({ description: 'The wizard name', type: String })
  @IsString()
  wizardName: string

  @ApiProperty({ description: 'The wizard name', type: String, required: false })
  @IsString()
  wizardDisplayName: string

  @ApiPropertyOptional({ description: 'The knowledge name', type: String })
  @IsString()
  @IsOptional()
  knowledgeName?: string

  @ApiPropertyOptional({ description: 'The spell name', type: String })
  @IsString()
  @IsOptional()
  spellName?: string

  @ApiPropertyOptional({ description: 'The stat name', type: String })
  @IsString()
  @IsOptional()
  statName?: string

  @ApiProperty({ description: 'The difficulty', enumName: 'Difficulty' })
  @IsEnum(Difficulty)
  difficulty: Difficulty
}
