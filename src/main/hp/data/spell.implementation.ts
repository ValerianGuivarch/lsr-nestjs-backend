import { DBSpell } from './spell.db'
import { Spell } from '../domain/entities/spell.entity'
import { ISpellProvider } from '../domain/providers/spell.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class SpellImplementation implements ISpellProvider {
  constructor(
    @InjectRepository(DBSpell, 'postgres')
    private readonly spellRepository: Repository<DBSpell>
  ) {}

  async findAll(): Promise<Spell[]> {
    return (
      await this.spellRepository.find({
        relations: DBSpell.RELATIONS
      })
    ).map(DBSpell.toSpell)
  }
}
