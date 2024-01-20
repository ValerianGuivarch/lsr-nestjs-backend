import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class SendRollRequest {
  @ApiProperty()
  @IsString()
  readonly rollerName: string

  @ApiProperty()
  @IsBoolean()
  readonly secret: boolean

  @ApiProperty()
  @IsBoolean()
  readonly focus: boolean

  @ApiProperty()
  @IsBoolean()
  readonly power: boolean

  @ApiProperty()
  @IsBoolean()
  readonly proficiency: boolean

  @ApiProperty()
  @IsNumber()
  readonly bonus: number

  @ApiProperty()
  @IsNumber()
  readonly malus: number

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  readonly empiriqueRoll?: string

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  readonly resistRoll?: string

  @ApiProperty()
  @IsString()
  readonly skillId: string

  @ApiProperty()
  @IsBoolean()
  readonly double: boolean
}
