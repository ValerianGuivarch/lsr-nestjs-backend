import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Stat } from '../../domain/stats/Stat'
import { IStatProvider } from '../../domain/stats/ports/IStatProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrStat } from './database/jdr-stat.db'
import { StatMapper } from './StatMapper'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { DBJdrCharacterStat } from '../characters/database/jdr-character-stat.db'

@Injectable()
export class StatProvider implements IStatProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrStat, 'jdr-sqlite') private readonly statRepo: Repository<DBJdrStat>
  ) {}

  async add(jdrSlug: string, p: { name: string }): Promise<Stat> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.statRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Stat '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.dataSource.transaction(async (manager) => {
      const statRepo = manager.getRepository(DBJdrStat)
      await statRepo.save(statRepo.create({ jdrSlug, slug, name: p.name }))
      const characters = await manager.getRepository(DBJdrCharacter).find({ where: { jdrSlug } })
      const values = manager.getRepository(DBJdrCharacterStat)
      for (const character of characters) {
        await values.save(values.create({ jdrSlug, characterSlug: character.slug, statSlug: slug, value: 2 }))
      }
    })
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, statSlug: string, p: { name: string }): Promise<Stat> {
    await this.statRepo.update({ jdrSlug, slug: statSlug }, { name: p.name })
    return this.findOneOrThrow(jdrSlug, statSlug)
  }

  async remove(jdrSlug: string, statSlug: string): Promise<void> {
    await this.statRepo.delete({ jdrSlug, slug: statSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Stat> {
    const db = await this.statRepo.findOne({ where: { jdrSlug, slug } })
    if (!db) throw JdrError.notFound(`Stat '${slug}'`)
    return StatMapper.toDomain(db)
  }
}
