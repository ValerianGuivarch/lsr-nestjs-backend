import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Jdr } from '../../domain/jdr/Jdr'
import { IJdrProvider } from '../../domain/jdr/ports/IJdrProvider'
import { DBJdr } from './database/DBJdr'
import { DBJdrDiceRoll } from '../rolls/database/jdr-dice-roll.db'
import { JdrMapper } from './JdrMapper'

@Injectable()
export class JdrImplementation implements IJdrProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrDiceRoll, 'jdr-sqlite') private readonly diceRollRepo: Repository<DBJdrDiceRoll>
  ) {}

  private async loadJdr(jdrSlug: string): Promise<DBJdr> {
    const db = await this.jdrRepo.findOne({
      where: { slug: jdrSlug },
      relations: DBJdr.RELATIONS,
      relationLoadStrategy: 'query'
    })
    if (!db) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    return db
  }

  async findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]> {
    return this.jdrRepo.find({ select: ['slug', 'name'] })
  }

  async findOneBySlug(jdrSlug: string): Promise<Jdr> {
    return JdrMapper.toDomain(await this.loadJdr(jdrSlug))
  }

  async create(p: { name: string; text?: string }): Promise<Jdr> {
    const slug = Slug.from(p.name)
    const existing = await this.jdrRepo.findOne({ where: { slug } })
    if (existing) throw JdrError.conflict(`Jdr slug '${slug}' already exists`)
    const created = this.jdrRepo.create({ slug, name: p.name, text: p.text ?? '' })
    await this.jdrRepo.save(created)
    return this.findOneBySlug(slug)
  }

  async update(jdrSlug: string, p: { name?: string; text?: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    await this.jdrRepo.update({ slug: jdrSlug }, { ...p, updatedDate: new Date() })
    return this.findOneBySlug(jdrSlug)
  }

  async delete(jdrSlug: string): Promise<void> {
    await this.loadJdr(jdrSlug)
    await this.diceRollRepo.delete({ jdrSlug })
    await this.jdrRepo.delete({ slug: jdrSlug })
  }
}
