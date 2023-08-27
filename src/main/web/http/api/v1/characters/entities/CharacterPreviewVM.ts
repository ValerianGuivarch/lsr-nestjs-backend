import { BattleState } from '../../../../../../domain/models/characters/BattleState'
import { Character } from '../../../../../../domain/models/characters/Character'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CharacterPreviewVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  pv: number

  @ApiProperty()
  pvMax: number

  @ApiProperty()
  isAlly: boolean

  @ApiPropertyOptional()
  playerName?: string

  @ApiPropertyOptional()
  picture?: string

  constructor(p: CharacterPreviewVM) {
    this.name = p.name
    this.pv = p.pv
    this.pvMax = p.pvMax
    this.playerName = p.playerName
    this.picture = p.picture
    this.isAlly = p.isAlly
  }

  static of(p: { character: Character }): CharacterPreviewVM {
    return new CharacterPreviewVM({
      name: p.character.name,
      pv: p.character.pv,
      pvMax: p.character.pvMax,
      playerName: p.character.playerName,
      picture: p.character.picture,
      isAlly: p.character.battleState === BattleState.ALLIES
    })
  }
}
