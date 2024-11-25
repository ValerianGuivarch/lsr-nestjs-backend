import { Spell } from '../entities/spell.entity'

export interface ISpellProvider {
  findAll(): Promise<Spell[]>

  createSpell(param: { name: string; knowledgeName: string; rank: number }): Promise<void>
}
