import { Apotheose } from '../../../../../../domain/models/characters/Apotheose'
import { BattleState } from '../../../../../../domain/models/characters/BattleState'
import { Category } from '../../../../../../domain/models/characters/Category'
import { Genre } from '../../../../../../domain/models/characters/Genre'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateCharacterDto {
  @ApiProperty()
  @IsString()
  readonly name: string

  @ApiProperty()
  @IsString()
  readonly classeName: string

  @ApiProperty()
  @IsString()
  readonly bloodlineName: string

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
  readonly dettes: number

  @ApiProperty({ default: 3 })
  @IsNumber()
  readonly arcanesMax: number

  @ApiProperty({ default: 1 })
  @IsNumber()
  readonly niveau: number

  @ApiProperty({ default: '' })
  @IsString()
  readonly lux: string

  @ApiProperty({ default: '' })
  @IsString()
  readonly umbra: string

  @ApiProperty({ default: '' })
  @IsString()
  readonly secunda: string

  @ApiProperty({ default: '' })
  @IsString()
  readonly notes: string

  @ApiProperty({
    enum: Category,
    enumName: 'Category'
  })
  @IsEnum(Category)
  readonly category: Category

  @ApiProperty({
    enum: Genre,
    enumName: 'Genre',
    default: Genre.AUTRE
  })
  @IsEnum(Genre)
  readonly genre: Genre

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly playerName?: string

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly picture?: string

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly pictureApotheose?: string

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly background?: string

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly buttonColor?: string

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  readonly textColor?: string

  @ApiProperty({
    enum: Apotheose,
    enumName: 'Apotheose',
    default: Apotheose.NONE
  })
  @IsEnum(Apotheose)
  apotheose: Apotheose

  @ApiProperty({ default: [], isArray: true })
  apotheoseImprovementList: string[]

  @ApiProperty({
    enum: BattleState,
    enumName: 'BattleState',
    default: BattleState.NONE
  })
  @IsEnum(BattleState)
  battleState: BattleState

  @ApiProperty({ default: 0 })
  @IsNumber()
  relance: number
}
