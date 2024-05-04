import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional } from 'class-validator'

export class UpdateSkillsAttributionDto {
  @ApiProperty()
  @IsNumber()
  readonly skillId: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly dailyUse?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly dailyUseMax?: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly arcaneDetteToDecrease?: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly affected?: boolean | null
}
