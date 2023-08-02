import { Classe } from '../models/characters/Classe'

export interface IClasseProvider {
  findAll(name: string): Promise<Classe[]>

  findOneByName(name: string): Promise<Classe>
}
