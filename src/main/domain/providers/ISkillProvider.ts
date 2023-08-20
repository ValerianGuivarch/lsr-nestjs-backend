import { Character } from '../models/characters/Character'
import { CharacterTemplate } from '../models/invocation/CharacterTemplate'
import { Skill } from '../models/skills/Skill'

export interface ISkillProvider {
  findSkillOwnedById(id: number): Promise<Skill>
  findSkillsByCharacter(character: Character): Promise<Skill[]>
  findSkillsByCharacterTemplate(characterTemplate: CharacterTemplate): Promise<Skill[]>
  affectSkillToCharacter(character: Character, skill: Skill): Promise<void>
  updateDailyUse(skillName: string, characterName: string, number: number): Promise<void>
  updateSkillAttribution(characterName: string, skillName: string, limitationMax: number): Promise<void>
}
