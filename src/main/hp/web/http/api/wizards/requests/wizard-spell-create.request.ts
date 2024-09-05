import { Difficulty } from '../../../../../domain/entities/difficulty.enum'
import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsEnum, IsUUID } from 'class-validator'

export class CreateWizardSpellRequest {
  @ApiProperty({ description: 'The class ID', type: String, format: 'uuid' })
  @IsUUID()
  @IsDefined()
  id: string

  @ApiProperty({ description: 'The spell difficulty', enumName: 'Difficulty' })
  @IsDefined()
  @IsEnum(Difficulty)
  difficulty: Difficulty
}
