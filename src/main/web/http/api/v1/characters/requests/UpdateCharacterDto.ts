import { ApotheoseState } from '../../../../../../domain/models/apotheoses/ApotheoseState'
import { BattleState } from '../../../../../../domain/models/characters/BattleState'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateCharacterDto {
  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly chair: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly esprit: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly essence: number

  @ApiProperty({ default: 4 })
  @IsNumber()
  readonly pv: number

  @ApiProperty({ default: 4 })
  @IsNumber()
  readonly pvMax: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly pf: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly pfMax: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly pp: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly ppMax: number

  @ApiProperty({ default: 3 })
  @IsNumber()
  readonly arcanes: number

  @ApiProperty({ default: 0 })
  @IsNumber()
  readonly ether: number

  @ApiProperty({ default: 1 })
  @IsNumber()
  readonly arcanePrimes: number

  @ApiProperty({ default: 0 })
  @IsNumber()
  readonly munitions: number

  @ApiProperty({ default: 0 })
  @IsNumber()
  readonly dettes: number

  @ApiProperty({ default: 0 })
  @IsNumber()
  readonly dragonDettes: number

  @ApiProperty({ default: 3 })
  @IsNumber()
  readonly arcanesMax: number

  @ApiProperty({ default: 1 })
  @IsNumber()
  readonly arcanePrimesMax: number

  @ApiProperty({ default: 1 })
  @IsNumber()
  readonly niveau: number

  @ApiProperty({ default: '' })
  @IsString()
  readonly lux: string

  @ApiPropertyOptional()
  @IsEnum(BattleState)
  @IsOptional()
  readonly battleState?: BattleState

  @ApiProperty({ default: '' })
  @IsString()
  readonly umbra: string

  @ApiProperty({ default: '' })
  @IsString()
  readonly secunda: string

  @ApiProperty({ default: '' })
  @IsString()
  readonly notes: string

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  apotheose?: string

  @ApiProperty({ default: 0 })
  @IsNumber()
  relance: number

  @IsOptional()
  apotheoseState?: ApotheoseState

  @IsOptional()
  apotheoseName?: string

  @ApiProperty({ default: 50 })
  @IsNumber()
  readonly vr: number
}
