import { Bloodline } from '../../../../../../domain/models/characters/Bloodline'
import { Category } from '../../../../../../domain/models/characters/Category'
import { Classe } from '../../../../../../domain/models/characters/Classe'
import { Genre } from '../../../../../../domain/models/characters/Genre'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateCharacterDto {
  @ApiProperty()
  @IsString()
  readonly name: string

  @ApiProperty({
    enum: Classe,
    enumName: 'Classe'
  })
  @IsEnum(Classe)
  readonly classe: Classe

  @ApiProperty({
    enum: Bloodline,
    enumName: 'Bloodline'
  })
  @IsEnum(Bloodline)
  readonly bloodline: Bloodline

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
  readonly pvMax: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly pfMax: number

  @ApiProperty({ default: 2 })
  @IsNumber()
  readonly ppMax: number

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
}
