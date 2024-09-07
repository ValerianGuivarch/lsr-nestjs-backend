import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsNumber } from 'class-validator'

export class CreateWizardStatRequest {
  @ApiProperty({ description: 'The stat name', type: String, format: 'varchar' })
  @IsDefined()
  name: string

  @ApiProperty({ description: 'The stat level', type: Number, format: 'int32' })
  @IsDefined()
  @IsNumber()
  level: number
}
