import { Proficiency } from '../models/proficiencies/Proficiency'

export interface IProficiencyProvider {
  findProficienciesByCharacter(characterName: string): Promise<Proficiency[]>
  findProficienciesByBloodline(bloodlineName: string): Promise<Proficiency[]>
  findProficienciesByClasse(classeName: string): Promise<Proficiency[]>
}
