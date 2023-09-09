import { Character } from './Character'
import { Apotheose } from '../apotheoses/Apotheose'
import { Proficiency } from '../proficiencies/Proficiency'
import { Skill } from '../skills/Skill'

export class FullCharacter {
  character: Character
  skills: Skill[]
  apotheoses: Apotheose[]
  proficiencies: Proficiency[]

  constructor(p: { character: Character; skills: Skill[]; apotheoses: Apotheose[]; proficiencies: Proficiency[] }) {
    this.character = p.character
    this.skills = p.skills
    this.apotheoses = p.apotheoses
    this.proficiencies = p.proficiencies
  }
}
