import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsNumber, IsUUID } from 'class-validator'

export class CreateWizardStatRequest {
  @ApiProperty({ description: 'The class ID', type: String, format: 'uuid' })
  @IsUUID()
  @IsDefined()
  id: string

  @ApiProperty({ description: 'The stat level', type: Number, format: 'int32' })
  @IsDefined()
  @IsNumber()
  level: number
}
