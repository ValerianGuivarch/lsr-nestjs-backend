import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateScenarioRequest {
  @ApiProperty({
    description: 'The scenario name',
    type: String
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'The scenario difficulty',
    type: String
  })
  @IsString()
  difficulty: string

  @ApiProperty({
    description: 'The scenario victory',
    type: String
  })
  @IsString()
  victory: string

  @ApiProperty({
    description: 'The scenario defeat',
    type: String
  })
  @IsString()
  defeat: string

  @ApiProperty({
    description: 'The scenario time',
    type: String
  })
  @IsString()
  time: string

  @ApiProperty({
    description: 'The scenario reward',
    type: String
  })
  @IsString()
  reward: string

  @ApiProperty({
    description: 'The scenario text',
    type: String
  })
  @IsString()
  text: string

  @ApiProperty({
    description: 'The scenario victory message',
    type: String
  })
  @IsString()
  victoryMsg: string

  @ApiProperty({
    description: 'The scenario defeat message',
    type: String
  })
  @IsString()
  defaiteMsg: string
}

export const CreateScenarioRequestExample1: CreateScenarioRequest = {
  name: '<SCENARIO 1>',
  difficulty: 'F',
  victory: 'Prendre un petit déjeuner calorique pour avoir de l’énergie',
  defeat: 'Manque de calories',
  time: '30 Minutes',
  reward: '100 PIECES',
  text: 'Vous vous réveillez dans votre lit, il est 7h30, vous avez faim. Vous avez un petit déjeuner à prendre avant de commencer votre journée.',
  victoryMsg: 'Vous avez prouvé votre valeur !',
  defaiteMsg: 'Vous avez perdu...'
}
