import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { Resource } from '../../domain/resources/Resource'
import { ResourceOwnerType } from '../../domain/resources/ResourceType'
import { IResourceProvider } from '../../domain/resources/ports/IResourceProvider'
import { JdrError } from '../../domain/shared/JdrError'
import { Slug } from '../../domain/shared/Slug'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { DBJdrCharacterResource } from '../characters/database/jdr-character-resource.db'
import { DBJdrGroup } from '../groups/database/jdr-group.db'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrGroupResource } from './database/jdr-group-resource.db'
import { DBJdrResource } from './database/jdr-resource.db'
import { ResourceMapper } from './ResourceMapper'

@Injectable()
export class ResourceProvider implements IResourceProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdrResource, 'jdr-sqlite') private readonly resourceRepo: Repository<DBJdrResource>
  ) {}

  async add(
    jdrSlug: string,
    p: { name: string; ownerType: ResourceOwnerType; defaultValue?: number }
  ): Promise<Resource> {
    const slug = Slug.from(p.name)
    await this.dataSource.transaction(async (manager) => {
      await this.ensureJdrExists(manager, jdrSlug)
      const resourceRepo = manager.getRepository(DBJdrResource)
      const existing = await resourceRepo.findOne({ where: { jdrSlug, slug } })
      if (existing) throw JdrError.conflict(`Resource '${slug}' already exists in jdr '${jdrSlug}'`)

      const oppositeOwnerCollision =
        p.ownerType === ResourceOwnerType.CHARACTER
          ? await manager.getRepository(DBJdrGroupResource).findOne({ where: { jdrSlug, resourceSlug: slug } })
          : await manager.getRepository(DBJdrCharacterResource).findOne({ where: { jdrSlug, resourceSlug: slug } })
      if (oppositeOwnerCollision) {
        throw JdrError.conflict(`Resource slug '${slug}' is already used locally by another owner type`)
      }

      const defaultValue = p.defaultValue ?? 0
      await resourceRepo.save(
        resourceRepo.create({ jdrSlug, slug, name: p.name, ownerType: p.ownerType, defaultValue })
      )
      await this.propagateDefinition(manager, { jdrSlug, slug, name: p.name, ownerType: p.ownerType, defaultValue })
    })
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, resourceSlug: string, p: { name?: string; defaultValue?: number }): Promise<Resource> {
    await this.dataSource.transaction(async (manager) => {
      const resourceRepo = manager.getRepository(DBJdrResource)
      const existing = await resourceRepo.findOne({ where: { jdrSlug, slug: resourceSlug } })
      if (!existing) throw JdrError.notFound(`Resource '${resourceSlug}'`)

      const patch: Partial<Pick<DBJdrResource, 'name' | 'defaultValue'>> = {}
      if (p.name !== undefined) patch.name = p.name
      if (p.defaultValue !== undefined) patch.defaultValue = p.defaultValue
      if (Object.keys(patch).length > 0) await resourceRepo.update({ jdrSlug, slug: resourceSlug }, patch)

      if (p.name !== undefined) {
        if (existing.ownerType === ResourceOwnerType.CHARACTER) {
          await manager.getRepository(DBJdrCharacterResource).update({ jdrSlug, resourceSlug }, { name: p.name })
        } else {
          await manager.getRepository(DBJdrGroupResource).update({ jdrSlug, resourceSlug }, { name: p.name })
        }
      }
    })
    return this.findOneOrThrow(jdrSlug, resourceSlug)
  }

  async remove(jdrSlug: string, resourceSlug: string): Promise<void> {
    const result = await this.resourceRepo.delete({ jdrSlug, slug: resourceSlug })
    if (!result.affected) throw JdrError.notFound(`Resource '${resourceSlug}'`)
  }

  private async propagateDefinition(
    manager: EntityManager,
    resource: Pick<DBJdrResource, 'jdrSlug' | 'slug' | 'name' | 'ownerType' | 'defaultValue'>
  ): Promise<void> {
    if (resource.ownerType === ResourceOwnerType.CHARACTER) {
      const owners = await manager.getRepository(DBJdrCharacter).find({ where: { jdrSlug: resource.jdrSlug } })
      const values = manager.getRepository(DBJdrCharacterResource)
      for (const character of owners) {
        const key = { jdrSlug: resource.jdrSlug, characterSlug: character.slug, resourceSlug: resource.slug }
        const existing = await values.findOne({ where: key })
        if (existing) await values.update(key, { name: resource.name })
        else await values.save(values.create({ ...key, name: resource.name, value: resource.defaultValue }))
      }
      return
    }

    const owners = await manager.getRepository(DBJdrGroup).find({ where: { jdrSlug: resource.jdrSlug } })
    const values = manager.getRepository(DBJdrGroupResource)
    for (const group of owners) {
      const key = { jdrSlug: resource.jdrSlug, groupSlug: group.slug, resourceSlug: resource.slug }
      const existing = await values.findOne({ where: key })
      if (existing) await values.update(key, { name: resource.name })
      else await values.save(values.create({ ...key, name: resource.name, value: resource.defaultValue }))
    }
  }

  private async ensureJdrExists(manager: EntityManager, jdrSlug: string): Promise<void> {
    const jdr = await manager.getRepository(DBJdr).findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Resource> {
    const db = await this.resourceRepo.findOne({ where: { jdrSlug, slug } })
    if (!db) throw JdrError.notFound(`Resource '${slug}'`)
    return ResourceMapper.toDomain(db)
  }
}
