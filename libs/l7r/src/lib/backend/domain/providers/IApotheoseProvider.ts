import { Apotheose } from '../models/apotheoses/Apotheose'

export interface IApotheoseProvider {
  findOneByName(name: string): Promise<Apotheose>
  findApotheosesByCharacter(characterName: string): Promise<Apotheose[]>
  findApotheosesByClasse(classeName: string): Promise<Apotheose[]>
}
