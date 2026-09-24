import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Item } from '../../domain/items/Item'
import { OwnedItem } from '../../domain/items/OwnedItem'
import { IItemProvider } from '../../domain/items/ports/IItemProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrItem } from './database/jdr-item.db'
import { DBJdrItemModifier } from './database/jdr-item-modifier.db'
import { DBJdrGroupItem } from './database/jdr-group-item.db'
import { ItemMapper } from './ItemMapper'

@Injectable()
export class ItemProvider implements IItemProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrItem, 'jdr-sqlite') private readonly itemRepo: Repository<DBJdrItem>,
    @InjectRepository(DBJdrItemModifier, 'jdr-sqlite') private readonly itemModifierRepo: Repository<DBJdrItemModifier>,
    @InjectRepository(DBJdrGroupItem, 'jdr-sqlite') private readonly groupItemRepo: Repository<DBJdrGroupItem>
  ) {}

  async add(
    jdrSlug: string,
    p: { name: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }
  ): Promise<Item> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.itemRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Item '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(DBJdrItem)
      const modifierRepo = manager.getRepository(DBJdrItemModifier)
      await itemRepo.save(
        itemRepo.create({
          jdrSlug,
          slug,
          name: p.name,
          description: p.description ?? '',
          unique: p.unique ?? true
        })
      )
      for (const modifier of p.modifiers ?? []) {
        await modifierRepo.save(
          modifierRepo.create({ jdrSlug, itemSlug: slug, statSlug: modifier.statSlug, value: modifier.value })
        )
      }
    })
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(
    jdrSlug: string,
    itemSlug: string,
    p: { name?: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }
  ): Promise<Item> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.description !== undefined) updates.description = p.description
    if (p.unique !== undefined) updates.unique = p.unique
    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(updates).length > 0)
        await manager.getRepository(DBJdrItem).update({ jdrSlug, slug: itemSlug }, updates)
      if (p.modifiers !== undefined) {
        const modifierRepo = manager.getRepository(DBJdrItemModifier)
        await modifierRepo.delete({ jdrSlug, itemSlug })
        for (const modifier of p.modifiers) {
          await modifierRepo.save(
            modifierRepo.create({ jdrSlug, itemSlug, statSlug: modifier.statSlug, value: modifier.value })
          )
        }
      }
    })
    return this.findOneOrThrow(jdrSlug, itemSlug)
  }

  async remove(jdrSlug: string, itemSlug: string): Promise<void> {
    await this.itemModifierRepo.delete({ jdrSlug, itemSlug })
    await this.itemRepo.delete({ jdrSlug, slug: itemSlug })
  }

  async addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<OwnedItem> {
    const existing = await this.groupItemRepo.findOne({ where: { jdrSlug, itemSlug: p.itemSlug } })
    if (existing) throw JdrError.conflict(`Group already owns item '${p.itemSlug}' in jdr '${jdrSlug}'`)
    const item = await this.itemRepo.findOne({ where: { jdrSlug, slug: p.itemSlug } })
    if (!item) throw JdrError.notFound(`Item '${p.itemSlug}' in jdr '${jdrSlug}'`)
    const quantity = p.quantity ?? 1
    if (!Number.isInteger(quantity) || quantity < 1)
      throw JdrError.badRequest(`Item quantity must be a positive integer`)
    if (item.unique && quantity !== 1) throw JdrError.badRequest(`Unique item '${p.itemSlug}' must have quantity 1`)
    const saved = await this.groupItemRepo.save(this.groupItemRepo.create({ jdrSlug, itemSlug: p.itemSlug, quantity }))
    return ItemMapper.toOwnedItem(saved)
  }

  async removeGroupItem(jdrSlug: string, itemSlug: string): Promise<void> {
    await this.groupItemRepo.delete({ jdrSlug, itemSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Item> {
    const db = await this.itemRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrItem.RELATIONS })
    if (!db) throw JdrError.notFound(`Item '${slug}'`)
    return ItemMapper.toDomain(db)
  }
}
