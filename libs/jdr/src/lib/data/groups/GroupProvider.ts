import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { JdrGroup } from '../../domain/groups/JdrGroup'
import { IGroupProvider } from '../../domain/groups/ports/IGroupProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrGroup } from './database/jdr-group.db'
import { DBJdrCharacterGroup } from '../characters/database/jdr-character-group.db'
import { GroupMapper } from './GroupMapper'
import { DBJdrResource } from '../resources/database/jdr-resource.db'
import { DBJdrGroupResource } from '../resources/database/jdr-group-resource.db'
import { ResourceOwnerType } from '../../domain/resources/ResourceType'

@Injectable()
export class GroupProvider implements IGroupProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrResource, 'jdr-sqlite') private readonly resourceRepo: Repository<DBJdrResource>,
    @InjectRepository(DBJdrGroupResource, 'jdr-sqlite')
    private readonly groupResourceRepo: Repository<DBJdrGroupResource>,
    @InjectRepository(DBJdrCharacterGroup, 'jdr-sqlite')
    private readonly characterGroupRepo: Repository<DBJdrCharacterGroup>
  ) {}

  async add(jdrSlug: string, p: { name: string; text?: string }): Promise<JdrGroup> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.groupRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Group '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.dataSource.transaction(async (manager) => {
      const groupRepo = manager.getRepository(DBJdrGroup)
      await groupRepo.save(groupRepo.create({ jdrSlug, slug, name: p.name, text: p.text ?? '' }))
      const definitions = await manager.getRepository(DBJdrResource).find({
        where: { jdrSlug, ownerType: ResourceOwnerType.GROUP }
      })
      const values = manager.getRepository(DBJdrGroupResource)
      for (const resource of definitions) {
        await values.save(
          values.create({
            jdrSlug,
            groupSlug: slug,
            resourceSlug: resource.slug,
            name: resource.name,
            value: resource.defaultValue
          })
        )
      }
    })
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

  async addGroupResource(jdrSlug: string, groupSlug: string, p: { name: string; value?: number }): Promise<JdrGroup> {
    await this.findOneOrThrow(jdrSlug, groupSlug)
    const resourceSlug = Slug.from(p.name)
    const existing = await this.groupResourceRepo.findOne({ where: { jdrSlug, groupSlug, resourceSlug } })
    if (existing) throw JdrError.conflict(`Group '${groupSlug}' already owns resource '${resourceSlug}'`)
    const definition = await this.resourceRepo.findOne({ where: { jdrSlug, slug: resourceSlug } })
    if (definition)
      throw JdrError.conflict(`Resource '${resourceSlug}' is defined by the JdR and cannot be added locally`)
    await this.groupResourceRepo.save(
      this.groupResourceRepo.create({
        jdrSlug,
        groupSlug,
        resourceSlug,
        name: p.name,
        value: p.value ?? 0
      })
    )
    return this.findOneOrThrow(jdrSlug, groupSlug)
  }

  async updateGroupResource(
    jdrSlug: string,
    groupSlug: string,
    resourceSlug: string,
    value: number
  ): Promise<JdrGroup> {
    const existing = await this.groupResourceRepo.findOne({ where: { jdrSlug, groupSlug, resourceSlug } })
    if (!existing) throw JdrError.notFound(`Resource '${resourceSlug}' on group '${groupSlug}'`)
    await this.groupResourceRepo.update({ jdrSlug, groupSlug, resourceSlug }, { value })
    return this.findOneOrThrow(jdrSlug, groupSlug)
  }

  async removeGroupResource(jdrSlug: string, groupSlug: string, resourceSlug: string): Promise<void> {
    const definition = await this.resourceRepo.findOne({
      where: { jdrSlug, slug: resourceSlug, ownerType: ResourceOwnerType.GROUP }
    })
    if (definition) throw JdrError.conflict(`JdR resource '${resourceSlug}' cannot be removed from a group`)
    await this.groupResourceRepo.delete({ jdrSlug, groupSlug, resourceSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<JdrGroup> {
    const db = await this.groupRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrGroup.RELATIONS })
    if (!db) throw JdrError.notFound(`Group '${slug}'`)
    return GroupMapper.toDomain(db)
  }
}
