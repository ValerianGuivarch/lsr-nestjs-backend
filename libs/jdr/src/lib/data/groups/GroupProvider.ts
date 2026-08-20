import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { JdrGroup } from '../../domain/groups/JdrGroup'
import { IGroupProvider } from '../../domain/groups/ports/IGroupProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrGroup } from './database/jdr-group.db'
import { DBJdrCharacterGroup } from '../characters/database/jdr-character-group.db'
import { GroupMapper } from './GroupMapper'

@Injectable()
export class GroupProvider implements IGroupProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrCharacterGroup, 'jdr-sqlite') private readonly characterGroupRepo: Repository<DBJdrCharacterGroup>
  ) {}

  async add(jdrSlug: string, p: { name: string; text?: string }): Promise<JdrGroup> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.groupRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Group '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.groupRepo.save(this.groupRepo.create({ jdrSlug, slug, name: p.name, text: p.text ?? '' }))
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<JdrGroup> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.text !== undefined) updates.text = p.text
    if (Object.keys(updates).length > 0) {
      await this.groupRepo.update({ jdrSlug, slug: groupSlug }, updates)
    }
    return this.findOneOrThrow(jdrSlug, groupSlug)
  }

  async remove(jdrSlug: string, groupSlug: string): Promise<void> {
    await this.characterGroupRepo.delete({ jdrSlug, groupSlug })
    await this.groupRepo.delete({ jdrSlug, slug: groupSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<JdrGroup> {
    const db = await this.groupRepo.findOne({ where: { jdrSlug, slug } })
    if (!db) throw JdrError.notFound(`Group '${slug}'`)
    return GroupMapper.toDomain(db)
  }
}
