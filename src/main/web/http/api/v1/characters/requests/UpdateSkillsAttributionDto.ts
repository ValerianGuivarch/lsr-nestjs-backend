import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateSkillsAttributionDto {
  @ApiProperty()
  @IsString()
  readonly skillName: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly dailyUse?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly limitationMax?: number | null
}
