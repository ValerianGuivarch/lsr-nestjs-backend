import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString } from 'class-validator'

export class UpdateMunitionDto {
  @ApiProperty()
  @IsString()
  readonly skillName: string

  @ApiProperty()
  @IsNumber()
  readonly limitationMax: number
}
