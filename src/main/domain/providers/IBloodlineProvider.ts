import { Bloodline } from '../models/characters/Bloodline'

export interface IBloodlineProvider {
  findAll(name: string): Promise<Bloodline[]>

  findOneByName(name: string): Promise<Bloodline>
}
