import { Character } from '../models/characters/Character'
import { Skill } from '../models/skills/Skill'

export interface ISkillProvider {
  //findAllArcane(): Promise<Skill[]>
  //findOneArcaneByName(name: string): Promise<Skill>
  findSkillOwnedById(id: number): Promise<Skill>
  findSkillsByCharacter(character: Character): Promise<Skill[]>
  findSkillByCharacterAndSkillName(character: Character, skillName): Promise<Skill>
}
