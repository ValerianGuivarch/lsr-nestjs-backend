import { Character } from '../../../../../../domain/models/characters/Character'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'


export class CharacterPreviewVM {
  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  playerName?: string

  @ApiPropertyOptional()
  picture?: string

  constructor(p: CharacterPreviewVM) {
    this.name = p.name
    this.playerName = p.playerName
    this.picture = p.picture
  }

  static of(p: { character: Character }): CharacterPreviewVM {
    return new CharacterPreviewVM({
      name: p.character.name,
      playerName: p.character.playerName,
      picture: p.character.picture
    })
  }
}
