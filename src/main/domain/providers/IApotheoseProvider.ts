import { Apotheose } from '../models/apotheoses/Apotheose'
import { Character } from '../models/characters/Character'

export interface IApotheoseProvider {
  findApotheosesByCharacter(character: Character): Promise<Apotheose[]>
  findApotheoseByCharacterAndName(character: Character): Promise<Apotheose>
}
