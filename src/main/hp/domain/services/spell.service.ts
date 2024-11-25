import { Spell } from '../entities/spell.entity'
import { ISpellProvider } from '../providers/spell.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class SpellService {
  constructor(@Inject('ISpellProvider') private spellProvider: ISpellProvider) {}

  async getAll(): Promise<Spell[]> {
    return await this.spellProvider.findAll()
  }

  async createSpell(param: { name: string; knowledgeName: string; rank: number }) {
    await this.spellProvider.createSpell(param)
  }
}
