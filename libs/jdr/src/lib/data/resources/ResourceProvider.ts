import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Resource } from '../../domain/resources/Resource'
import { ResourceType } from '../../domain/resources/ResourceType'
import { GroupResourceValue } from '../../domain/resources/GroupResourceValue'
import { IResourceProvider } from '../../domain/resources/ports/IResourceProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrResource } from './database/jdr-resource.db'
import { DBJdrGroupResource } from './database/jdr-group-resource.db'
import { ResourceMapper } from './ResourceMapper'

@Injectable()
export class ResourceProvider implements IResourceProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrResource, 'jdr-sqlite') private readonly resourceRepo: Repository<DBJdrResource>,
    @InjectRepository(DBJdrGroupResource, 'jdr-sqlite') private readonly groupResourceRepo: Repository<DBJdrGroupResource>
  ) {}

  async add(jdrSlug: string, p: { name: string; type: string }): Promise<Resource> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.resourceRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Resource '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.resourceRepo.save(this.resourceRepo.create({ jdrSlug, slug, name: p.name, type: p.type as ResourceType }))
    if ((p.type as ResourceType) === ResourceType.GROUP) {
      await this.groupResourceRepo.save(this.groupResourceRepo.create({ jdrSlug, resourceSlug: slug, value: 0 }))
    }
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<Resource> {
    const updates: Record<string, unknown> = {}
    if (p.name) updates.name = p.name
    if (p.type) updates.type = p.type
    if (Object.keys(updates).length > 0) {
      await this.resourceRepo.update({ jdrSlug, slug: resourceSlug }, updates)
    }
    return this.findOneOrThrow(jdrSlug, resourceSlug)
  }

  async remove(jdrSlug: string, resourceSlug: string): Promise<void> {
    await this.resourceRepo.delete({ jdrSlug, slug: resourceSlug })
  }

  async updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<GroupResourceValue> {
    const existing = await this.groupResourceRepo.findOne({ where: { jdrSlug, resourceSlug } })
    if (existing) {
      await this.groupResourceRepo.update({ jdrSlug, resourceSlug }, { value })
    } else {
      await this.groupResourceRepo.save(this.groupResourceRepo.create({ jdrSlug, resourceSlug, value }))
    }
    const db = await this.groupResourceRepo.findOne({ where: { jdrSlug, resourceSlug } })
    if (!db) throw JdrError.notFound(`GroupResource '${resourceSlug}'`)
    return ResourceMapper.toGroupResourceValue(db)
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Resource> {
    const db = await this.resourceRepo.findOne({ where: { jdrSlug, slug } })
    if (!db) throw JdrError.notFound(`Resource '${slug}'`)
    return ResourceMapper.toDomain(db)
  }
}
