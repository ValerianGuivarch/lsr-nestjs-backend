import { Character } from '../models/characters/Character'
import { Skill } from '../models/skills/Skill'

export interface ISkillProvider {
  findSkillOwnedById(id: number): Promise<Skill>
  findSkillsByCharacter(character: Character): Promise<Skill[]>
  updateDailyUse(skillName: string, characterName: string, number: number): Promise<void>
}
