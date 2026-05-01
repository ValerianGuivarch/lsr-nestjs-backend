import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional } from 'class-validator'

export class UpdateRollRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  success?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  healPoint?: number
}
