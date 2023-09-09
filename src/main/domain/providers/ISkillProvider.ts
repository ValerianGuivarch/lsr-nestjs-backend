import { Character } from '../models/characters/Character'
import { Skill } from '../models/skills/Skill'

export interface ISkillProvider {
  findOneById(id: string): Promise<Skill>
  findSkillsForAll(): Promise<Skill[]>
  findSkillsByCharacter(characterName: string): Promise<Skill[]>
  findSkillsByBloodline(bloodlineName: string): Promise<Skill[]>
  findSkillsByClasse(classeName: string): Promise<Skill[]>
  findSkillsByCharacterTemplate(name: string): Promise<Skill[]>
  affectSkillToCharacter(createdInvocation: Character, skill: Skill): Promise<void>
}
