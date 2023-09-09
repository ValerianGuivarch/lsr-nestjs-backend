import { Skill } from './Skill'
import { Character } from '../characters/Character'

export class CharacterSkill {
  character: Character
  skill: Skill
  dailyUse?: number
  limitationMax?: number

  constructor(character: Character, skill: Skill, dailyUse?: number, limitationMax?: number) {
    this.character = character
    this.skill = skill
    this.dailyUse = dailyUse
    this.limitationMax = limitationMax
  }
}
