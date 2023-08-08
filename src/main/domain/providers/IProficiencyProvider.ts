import { Character } from '../models/characters/Character'
import { Proficiency } from '../models/proficiencies/Proficiency'

export interface IProficiencyProvider {
  findProficienciesByCharacter(character: Character): Promise<Proficiency[]>
}
