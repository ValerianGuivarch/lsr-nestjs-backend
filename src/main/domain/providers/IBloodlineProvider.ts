import { Bloodline } from '../models/characters/Bloodline'

export interface IBloodlineProvider {
  findAll(): Promise<Bloodline[]>

  findOneByName(name: string): Promise<Bloodline>
}
