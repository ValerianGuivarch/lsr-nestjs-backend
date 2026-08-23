import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, EntityManager } from 'typeorm'
import { Jdr } from '../../domain/jdr/Jdr'
import { JdrError } from '../../domain/shared/JdrError'
import { Slug } from '../../domain/shared/Slug'
import { ResourceOwnerType } from '../../domain/resources/ResourceType'
import { TraitType } from '../../domain/traits/TraitType'
import { DBJdrCharacterGroup } from '../../data/characters/database/jdr-character-group.db'
import { DBJdrCharacterItem } from '../../data/characters/database/jdr-character-item.db'
import { DBJdrCharacterResource } from '../../data/characters/database/jdr-character-resource.db'
import { DBJdrCharacterStat } from '../../data/characters/database/jdr-character-stat.db'
import { DBJdrCharacterTrait } from '../../data/characters/database/jdr-character-trait.db'
import { DBJdrCharacter } from '../../data/characters/database/jdr-character.db'
import { DBJdrClass } from '../../data/classes/database/jdr-class.db'
import { DBJdrGroup } from '../../data/groups/database/jdr-group.db'
import { DBJdrGroupItem } from '../../data/items/database/jdr-group-item.db'
import { DBJdrItemModifier } from '../../data/items/database/jdr-item-modifier.db'
import { DBJdrItem } from '../../data/items/database/jdr-item.db'
import { JdrMapper } from '../../data/jdr/JdrMapper'
import { DBJdr } from '../../data/jdr/database/DBJdr'
import { DBJdrPlayer } from '../../data/players/database/jdr-player.db'
import { DBJdrGroupResource } from '../../data/resources/database/jdr-group-resource.db'
import { DBJdrResource } from '../../data/resources/database/jdr-resource.db'
import { DBJdrStat } from '../../data/stats/database/jdr-stat.db'
import { DBJdrTraitModifier } from '../../data/traits/database/DBJdrTraitModifier'
import { DBJdrTrait } from '../../data/traits/database/DBJdrTrait'
import { ImportJdrData, JdrImportRequest } from './dto/JdrImportRequest'

@Injectable()
export class JdrImportService {
  constructor(@InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource) {}

  async import(request: JdrImportRequest): Promise<Jdr> {
    if (request.version !== 1) throw JdrError.badRequest(`Unsupported import version '${request.version}'`)
    if (!request.jdr || typeof request.jdr.name !== 'string' || !request.jdr.name.trim())
      throw JdrError.badRequest(`jdr.name is required`)

    const jdrSlug = request.jdr.slug ?? Slug.from(request.jdr.name)
    try {
      Slug.assertValid(jdrSlug)
    } catch (error) {
      throw JdrError.badRequest(error instanceof Error ? error.message : String(error))
    }
    if (await this.dataSource.getRepository(DBJdr).existsBy({ slug: jdrSlug }))
      throw JdrError.conflict(`Jdr slug '${jdrSlug}' already exists`)

    try {
      return await this.dataSource.transaction(async (manager) => {
        await this.insertAggregate(manager, jdrSlug, request.jdr)
        const db = await manager.findOne(DBJdr, {
          where: { slug: jdrSlug },
          relations: DBJdr.RELATIONS,
          relationLoadStrategy: 'query'
        })
        if (!db) throw new Error(`Imported JdR could not be loaded`)
        return JdrMapper.toDomain(db)
      })
    } catch (error) {
      if (error instanceof JdrError) throw error
      throw JdrError.badRequest(`Invalid JdR import: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async insertAggregate(manager: EntityManager, jdrSlug: string, data: ImportJdrData): Promise<void> {
    const withSlug = <T extends { name: string; slug?: string }>(value: T) => ({
      ...value,
      slug: value.slug ?? Slug.from(value.name)
    })
    const stats = (data.stats ?? []).map(withSlug)
    const resources = (data.resources ?? []).map(withSlug)
    const classes = (data.classes ?? []).map(withSlug)
    const groups = (data.groups ?? []).map(withSlug)
    const players = (data.players ?? []).map(withSlug)
    const traits = (data.traits ?? []).map(withSlug)
    const items = (data.items ?? []).map(withSlug)
    const characters = (data.characters ?? []).map(withSlug)

    const statSlugs = new Set(stats.map((stat) => stat.slug))
    for (const character of characters) {
      const unknownStat = (character.stats ?? []).find((stat) => !statSlugs.has(stat.statSlug))
      if (unknownStat)
        throw new Error(`Character '${character.slug}' references unknown stat '${unknownStat.statSlug}'`)
    }

    await manager.save(DBJdr, manager.create(DBJdr, { slug: jdrSlug, name: data.name, text: data.text ?? '' }))
    await manager.save(
      DBJdrStat,
      stats.map((s) => manager.create(DBJdrStat, { jdrSlug, slug: s.slug, name: s.name }))
    )
    await manager.save(
      DBJdrResource,
      resources.map((r) =>
        manager.create(DBJdrResource, {
          jdrSlug,
          slug: r.slug,
          name: r.name,
          ownerType: r.ownerType as ResourceOwnerType,
          defaultValue: r.defaultValue ?? 0
        })
      )
    )
    await manager.save(
      DBJdrClass,
      classes.map((c) =>
        manager.create(DBJdrClass, { jdrSlug, slug: c.slug, name: c.name, text: c.text ?? '', levels: c.levels ?? [] })
      )
    )
    await manager.save(
      DBJdrGroup,
      groups.map((g) => manager.create(DBJdrGroup, { jdrSlug, slug: g.slug, name: g.name, text: g.text ?? '' }))
    )
    await manager.save(
      DBJdrPlayer,
      players.map((p) => manager.create(DBJdrPlayer, { jdrSlug, slug: p.slug, name: p.name }))
    )
    await manager.save(
      DBJdrTrait,
      traits.map((t) =>
        manager.create(DBJdrTrait, {
          jdrSlug,
          slug: t.slug,
          name: t.name,
          type: (t.type ?? 'Normal') as TraitType,
          level: t.level ?? null,
          data: t.data ?? null
        })
      )
    )
    await manager.save(
      DBJdrTraitModifier,
      traits.flatMap((t) =>
        (t.modifiers ?? []).map((m) => manager.create(DBJdrTraitModifier, { jdrSlug, traitSlug: t.slug, ...m }))
      )
    )
    await manager.save(
      DBJdrItem,
      items.map((i) =>
        manager.create(DBJdrItem, {
          jdrSlug,
          slug: i.slug,
          name: i.name,
          description: i.description ?? '',
          unique: i.unique ?? true
        })
      )
    )
    await manager.save(
      DBJdrItemModifier,
      items.flatMap((i) =>
        (i.modifiers ?? []).map((m) => manager.create(DBJdrItemModifier, { jdrSlug, itemSlug: i.slug, ...m }))
      )
    )

    const groupDefinitions = resources.filter((r) => r.ownerType === 'GROUP')
    await manager.save(
      DBJdrGroupResource,
      groups.flatMap((g) => {
        const overrides = new Map((g.resources ?? []).map((r) => [r.resourceSlug, r]))
        const inherited = groupDefinitions.map((r) => ({
          resourceSlug: r.slug,
          name: r.name,
          value: r.defaultValue ?? 0
        }))
        const local = (g.resources ?? []).filter((r) => !groupDefinitions.some((d) => d.slug === r.resourceSlug))
        return [...inherited, ...local].map((r) => {
          const override = overrides.get(r.resourceSlug)
          return manager.create(DBJdrGroupResource, {
            jdrSlug,
            groupSlug: g.slug,
            resourceSlug: r.resourceSlug,
            name: override?.name ?? r.name ?? r.resourceSlug,
            value: override?.value ?? r.value
          })
        })
      })
    )
    await manager.save(
      DBJdrGroupItem,
      (data.groupItems ?? []).map((i) =>
        manager.create(DBJdrGroupItem, { jdrSlug, itemSlug: i.itemSlug, quantity: i.quantity ?? 1 })
      )
    )
    await manager.save(
      DBJdrCharacter,
      characters.map((c) =>
        manager.create(DBJdrCharacter, {
          jdrSlug,
          slug: c.slug,
          name: c.name,
          playerSlug: c.playerSlug ?? null,
          classSlug: c.classSlug ?? null,
          classLevel: c.classLevel ?? null,
          isPlayable: c.isPlayable ?? false,
          public: c.public ?? true,
          text: c.text ?? ''
        })
      )
    )
    await manager.save(
      DBJdrCharacterStat,
      characters.flatMap((c) => {
        const values = new Map((c.stats ?? []).map((s) => [s.statSlug, s.value]))
        return stats.map((s) =>
          manager.create(DBJdrCharacterStat, {
            jdrSlug,
            characterSlug: c.slug,
            statSlug: s.slug,
            value: values.get(s.slug) ?? 2
          })
        )
      })
    )
    await manager.save(
      DBJdrCharacterTrait,
      characters.flatMap((c) =>
        (c.traitSlugs ?? []).map((traitSlug) =>
          manager.create(DBJdrCharacterTrait, { jdrSlug, characterSlug: c.slug, traitSlug })
        )
      )
    )
    await manager.save(
      DBJdrCharacterItem,
      characters.flatMap((c) =>
        (c.items ?? []).map((i) =>
          manager.create(DBJdrCharacterItem, {
            jdrSlug,
            characterSlug: c.slug,
            itemSlug: i.itemSlug,
            quantity: i.quantity ?? 1
          })
        )
      )
    )
    await manager.save(
      DBJdrCharacterGroup,
      characters.flatMap((c) =>
        (c.groupSlugs ?? []).map((groupSlug) =>
          manager.create(DBJdrCharacterGroup, { jdrSlug, characterSlug: c.slug, groupSlug })
        )
      )
    )

    const characterDefinitions = resources.filter((r) => r.ownerType === 'CHARACTER')
    await manager.save(
      DBJdrCharacterResource,
      characters.flatMap((c) => {
        const overrides = new Map((c.resources ?? []).map((r) => [r.resourceSlug, r]))
        const inherited = characterDefinitions.map((r) => ({
          resourceSlug: r.slug,
          name: r.name,
          value: r.defaultValue ?? 0
        }))
        const local = (c.resources ?? []).filter((r) => !characterDefinitions.some((d) => d.slug === r.resourceSlug))
        return [...inherited, ...local].map((r) => {
          const override = overrides.get(r.resourceSlug)
          return manager.create(DBJdrCharacterResource, {
            jdrSlug,
            characterSlug: c.slug,
            resourceSlug: r.resourceSlug,
            name: override?.name ?? r.name ?? r.resourceSlug,
            value: override?.value ?? r.value
          })
        })
      })
    )
  }
}
