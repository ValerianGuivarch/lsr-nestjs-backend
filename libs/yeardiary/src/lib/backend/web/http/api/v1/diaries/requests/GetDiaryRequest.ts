import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class GetDiaryRequest {
  @ApiProperty({ description: 'The diary day', type: Number })
  @IsString()
  day: number

  @ApiProperty({ description: 'The diary month', type: Number })
  @IsString()
  month: number
}
