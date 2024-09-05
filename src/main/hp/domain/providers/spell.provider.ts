import { Spell } from '../entities/spell.entity'

export interface ISpellProvider {
  findAll(): Promise<Spell[]>
}
