import { Difficulty } from '../../../../../domain/entities/difficulty.enum'
import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsEnum } from 'class-validator'

export class CreateWizardSpellRequest {
  @ApiProperty({ description: 'The spell name', type: String, format: 'varchar' })
  @IsDefined()
  name: string

  @ApiProperty({ description: 'The spell difficulty', enumName: 'Difficulty' })
  @IsDefined()
  @IsEnum(Difficulty)
  difficulty: Difficulty
}
