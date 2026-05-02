import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator'

export class CreateDiaryRequest {
  @ApiProperty({ description: 'The diary text', type: String })
  @IsString()
  text: string

  @ApiProperty({ description: 'The diary day', type: Number })
  @IsNumber()
  day: number

  @ApiProperty({ description: 'The diary month', type: Number })
  @IsNumber()
  month: number

  @ApiProperty({ description: 'The diary year', type: Number })
  @IsNumber()
  year: number
}

export const CreateDiaryRequestExample = {
  text: 'This is a diary',
  day: 1,
  month: 1,
  year: 2021
}
