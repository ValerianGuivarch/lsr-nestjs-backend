import { Classe } from '../models/characters/Classe'

export interface IClasseProvider {
  findAll(): Promise<Classe[]>

  findOneByName(name: string): Promise<Classe>
}
