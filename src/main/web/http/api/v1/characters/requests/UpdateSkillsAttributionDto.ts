import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateSkillsAttributionDto {
  @ApiProperty()
  @IsString()
  readonly skillName: string

  @ApiProperty()
  @IsNumber()
  readonly dailyUse: number

  @ApiPropertyOptional({ nullable: true, default: null })
  @IsOptional()
  @IsNumber()
  readonly limitationMax: number | null
}
