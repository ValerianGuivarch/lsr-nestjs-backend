import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { DBJdr } from '../jdr/database/DBJdr'
import { Trait } from '../../domain/traits/Trait'
import { TraitType } from '../../domain/traits/TraitType'
import { ITraitProvider } from '../../domain/traits/ports/ITraitProvider'
import { DBJdrTrait } from './database/DBJdrTrait'
import { DBJdrTraitModifier } from './database/DBJdrTraitModifier'
import { TraitMapper } from './TraitMapper'

@Injectable()
export class TraitProvider implements ITraitProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrTrait, 'jdr-sqlite') private readonly traitRepo: Repository<DBJdrTrait>,
    @InjectRepository(DBJdrTraitModifier, 'jdr-sqlite') private readonly traitModifierRepo: Repository<DBJdrTraitModifier>
  ) {}

  async add(jdrSlug: string, p: { name: string; type: string; level?: number; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Trait> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.traitRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Trait '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.traitRepo.save(this.traitRepo.create({ jdrSlug, slug, name: p.name, type: p.type as TraitType, level: p.level ?? null, data: p.data ?? null }))
    for (const modifier of p.modifiers ?? []) {
      await this.traitModifierRepo.save(this.traitModifierRepo.create({ jdrSlug, traitSlug: slug, statSlug: modifier.statSlug, value: modifier.value }))
    }
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, traitSlug: string, p: { name?: string; type?: string; level?: number | null; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Trait> {
    const existing = await this.traitRepo.findOne({ where: { jdrSlug, slug: traitSlug } })
    if (!existing) throw JdrError.notFound(`Trait '${traitSlug}'`)
    const patch: { name?: string; type?: TraitType; level?: number | null; data?: Record<string, unknown> | null; updatedDate: Date } = { updatedDate: new Date() }
    if (p.name !== undefined) patch.name = p.name
    if (p.type !== undefined) patch.type = p.type as TraitType
    if (p.level !== undefined) patch.level = p.level
    if (p.data !== undefined) patch.data = p.data
    await this.traitRepo.update({ jdrSlug, slug: traitSlug }, patch)
    if (p.modifiers !== undefined) {
      await this.traitModifierRepo.delete({ jdrSlug, traitSlug })
      for (const modifier of p.modifiers) {
        await this.traitModifierRepo.save(this.traitModifierRepo.create({ jdrSlug, traitSlug, statSlug: modifier.statSlug, value: modifier.value }))
      }
    }
    return this.findOneOrThrow(jdrSlug, traitSlug)
  }

  async remove(jdrSlug: string, traitSlug: string): Promise<void> {
    await this.traitModifierRepo.delete({ jdrSlug, traitSlug })
    await this.traitRepo.delete({ jdrSlug, slug: traitSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Trait> {
    const db = await this.traitRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrTrait.RELATIONS })
    if (!db) throw JdrError.notFound(`Trait '${slug}'`)
    return TraitMapper.toDomain(db)
  }
}
