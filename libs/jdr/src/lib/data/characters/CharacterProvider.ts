import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Character } from '../../domain/characters/Character'
import { ResourceOwnerType } from '../../domain/resources/ResourceType'
import { ICharacterProvider } from '../../domain/characters/ports/ICharacterProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrClass } from '../classes/database/jdr-class.db'
import { DBJdrGroup } from '../groups/database/jdr-group.db'
import { DBJdrCharacter } from './database/jdr-character.db'
import { DBJdrCharacterStat } from './database/jdr-character-stat.db'
import { DBJdrCharacterTrait } from './database/jdr-character-trait.db'
import { DBJdrCharacterItem } from './database/jdr-character-item.db'
import { DBJdrCharacterResource } from './database/jdr-character-resource.db'
import { DBJdrCharacterGroup } from './database/jdr-character-group.db'
import { CharacterMapper } from './CharacterMapper'
import { DBJdrTrait } from '../traits/database/DBJdrTrait'
import { DBJdrItem } from '../items/database/jdr-item.db'
import { DBJdrResource } from '../resources/database/jdr-resource.db'
import { DBJdrPlayer } from '../players/database/jdr-player.db'

@Injectable()
export class CharacterProvider implements ICharacterProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrPlayer, 'jdr-sqlite') private readonly playerRepo: Repository<DBJdrPlayer>,
    @InjectRepository(DBJdrTrait, 'jdr-sqlite') private readonly traitRepo: Repository<DBJdrTrait>,
    @InjectRepository(DBJdrItem, 'jdr-sqlite') private readonly itemRepo: Repository<DBJdrItem>,
    @InjectRepository(DBJdrResource, 'jdr-sqlite') private readonly resourceRepo: Repository<DBJdrResource>,
    @InjectRepository(DBJdrCharacter, 'jdr-sqlite') private readonly characterRepo: Repository<DBJdrCharacter>,
    @InjectRepository(DBJdrCharacterStat, 'jdr-sqlite')
    private readonly characterStatRepo: Repository<DBJdrCharacterStat>,
    @InjectRepository(DBJdrCharacterTrait, 'jdr-sqlite')
    private readonly characterTraitRepo: Repository<DBJdrCharacterTrait>,
    @InjectRepository(DBJdrCharacterItem, 'jdr-sqlite')
    private readonly characterItemRepo: Repository<DBJdrCharacterItem>,
    @InjectRepository(DBJdrCharacterResource, 'jdr-sqlite')
    private readonly characterResourceRepo: Repository<DBJdrCharacterResource>,
    @InjectRepository(DBJdrCharacterGroup, 'jdr-sqlite')
    private readonly characterGroupRepo: Repository<DBJdrCharacterGroup>
  ) {}

  async add(
    jdrSlug: string,
    p: {
      name: string
      playerSlug?: string
      classSlug?: string
      classLevel?: string
      isPlayable?: boolean
      public?: boolean
      text?: string
    }
  ): Promise<Character> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug }, relations: { stats: true, resources: true } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    const slug = Slug.from(p.name)
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Character '${slug}' already exists in jdr '${jdrSlug}'`)

    const classSlug = p.classSlug || undefined
    const playerSlug = p.playerSlug || undefined
    await this.ensureCharacterClass(jdrSlug, classSlug, p.classLevel)
    await this.ensurePlayer(jdrSlug, playerSlug)
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(DBJdrCharacter).save(
        manager.getRepository(DBJdrCharacter).create({
          jdrSlug,
          slug,
          name: p.name,
          playerSlug: playerSlug ?? null,
          classSlug: classSlug ?? null,
          classLevel: p.classLevel ?? null,
          isPlayable: p.isPlayable ?? false,
          public: p.public ?? true,
          text: p.text ?? ''
        })
      )
      for (const stat of jdr.stats ?? []) {
        const repo = manager.getRepository(DBJdrCharacterStat)
        await repo.save(repo.create({ jdrSlug, characterSlug: slug, statSlug: stat.slug, value: 2 }))
      }
      for (const resource of (jdr.resources ?? []).filter((r) => r.ownerType === ResourceOwnerType.CHARACTER)) {
        const repo = manager.getRepository(DBJdrCharacterResource)
        await repo.save(
          repo.create({
            jdrSlug,
            characterSlug: slug,
            resourceSlug: resource.slug,
            name: resource.name,
            value: resource.defaultValue
          })
        )
      }
    })
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(
    jdrSlug: string,
    characterSlug: string,
    p: {
      name?: string
      playerSlug?: string
      classSlug?: string
      classLevel?: string
      isPlayable?: boolean
      public?: boolean
      text?: string
    }
  ): Promise<Character> {
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
    if (!existing) throw JdrError.notFound(`Character '${characterSlug}'`)

    const classSlug = p.classSlug === undefined ? undefined : p.classSlug || undefined
    const effectiveClassSlug = p.classSlug === undefined ? (existing.classSlug ?? undefined) : classSlug
    const effectiveLevel =
      p.classLevel === undefined
        ? p.classSlug !== undefined && !classSlug
          ? undefined
          : (existing.classLevel ?? undefined)
        : p.classLevel || undefined
    const playerSlug = p.playerSlug === undefined ? undefined : p.playerSlug || undefined
    await this.ensureCharacterClass(jdrSlug, effectiveClassSlug, effectiveLevel)
    await this.ensurePlayer(jdrSlug, playerSlug)

    const patch: {
      name?: string
      text?: string
      playerSlug?: string | null
      classSlug?: string | null
      classLevel?: string | null
      isPlayable?: boolean
      public?: boolean
      updatedDate: Date
    } = {
      updatedDate: new Date()
    }
    if (p.name !== undefined) patch.name = p.name
    if (p.text !== undefined) patch.text = p.text
    if (p.playerSlug !== undefined) patch.playerSlug = playerSlug ?? null
    if (p.classSlug !== undefined) patch.classSlug = classSlug ?? null
    if (p.classSlug !== undefined && !classSlug && p.classLevel === undefined) patch.classLevel = null
    if (p.classLevel !== undefined) patch.classLevel = p.classLevel || null
    if (p.isPlayable !== undefined) patch.isPlayable = p.isPlayable
    if (p.public !== undefined) patch.public = p.public

    await this.characterRepo.update({ jdrSlug, slug: characterSlug }, patch)
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async remove(jdrSlug: string, characterSlug: string): Promise<void> {
    await this.characterRepo.delete({ jdrSlug, slug: characterSlug })
  }

  async addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Character> {
    const existing = await this.characterGroupRepo.findOne({ where: { jdrSlug, characterSlug, groupSlug } })
    if (!existing) {
      const group = await this.groupRepo.findOne({ where: { jdrSlug, slug: groupSlug } })
      if (!group) throw JdrError.notFound(`Group '${groupSlug}' in jdr '${jdrSlug}'`)
      const character = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
      if (!character) throw JdrError.notFound(`Character '${characterSlug}'`)
      await this.characterGroupRepo.save(this.characterGroupRepo.create({ jdrSlug, characterSlug, groupSlug }))
    }
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<void> {
    await this.characterGroupRepo.delete({ jdrSlug, characterSlug, groupSlug })
  }

  async addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Character> {
    const existing = await this.characterTraitRepo.findOne({ where: { jdrSlug, characterSlug, traitSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already has trait '${traitSlug}'`)
    await this.ensureCharacterExists(jdrSlug, characterSlug)
    const trait = await this.traitRepo.findOne({ where: { jdrSlug, slug: traitSlug } })
    if (!trait) throw JdrError.notFound(`Trait '${traitSlug}' in jdr '${jdrSlug}'`)
    await this.characterTraitRepo.save(this.characterTraitRepo.create({ jdrSlug, characterSlug, traitSlug }))
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<void> {
    await this.characterTraitRepo.delete({ jdrSlug, characterSlug, traitSlug })
  }

  async addCharacterItem(
    jdrSlug: string,
    characterSlug: string,
    p: { itemSlug: string; quantity?: number }
  ): Promise<Character> {
    const existing = await this.characterItemRepo.findOne({ where: { jdrSlug, characterSlug, itemSlug: p.itemSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already owns item '${p.itemSlug}'`)
    await this.ensureCharacterExists(jdrSlug, characterSlug)
    const item = await this.itemRepo.findOne({ where: { jdrSlug, slug: p.itemSlug } })
    if (!item) throw JdrError.notFound(`Item '${p.itemSlug}' in jdr '${jdrSlug}'`)
    const quantity = p.quantity ?? 1
    if (!Number.isInteger(quantity) || quantity < 1)
      throw JdrError.badRequest(`Item quantity must be a positive integer`)
    if (item.unique && quantity !== 1) throw JdrError.badRequest(`Unique item '${p.itemSlug}' must have quantity 1`)
    await this.characterItemRepo.save(
      this.characterItemRepo.create({ jdrSlug, characterSlug, itemSlug: p.itemSlug, quantity })
    )
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<void> {
    await this.characterItemRepo.delete({ jdrSlug, characterSlug, itemSlug })
  }

  async updateCharacterStat(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    value: number
  ): Promise<Character> {
    const existing = await this.characterStatRepo.findOne({ where: { jdrSlug, characterSlug, statSlug } })
    if (!existing) throw JdrError.notFound(`Stat '${statSlug}' on character '${characterSlug}'`)
    await this.characterStatRepo.update({ jdrSlug, characterSlug, statSlug }, { value })
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async updateCharacterResource(
    jdrSlug: string,
    characterSlug: string,
    resourceSlug: string,
    value: number
  ): Promise<Character> {
    const existing = await this.characterResourceRepo.findOne({ where: { jdrSlug, characterSlug, resourceSlug } })
    if (!existing) throw JdrError.notFound(`Resource '${resourceSlug}' on character '${characterSlug}'`)
    await this.characterResourceRepo.update({ jdrSlug, characterSlug, resourceSlug }, { value })
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async addCharacterResource(
    jdrSlug: string,
    characterSlug: string,
    p: { name: string; value?: number }
  ): Promise<Character> {
    await this.ensureCharacterExists(jdrSlug, characterSlug)
    const resourceSlug = Slug.from(p.name)
    const existing = await this.characterResourceRepo.findOne({ where: { jdrSlug, characterSlug, resourceSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already owns resource '${resourceSlug}'`)
    const definition = await this.resourceRepo.findOne({ where: { jdrSlug, slug: resourceSlug } })
    if (definition)
      throw JdrError.conflict(`Resource '${resourceSlug}' is defined by the JdR and cannot be added locally`)
    await this.characterResourceRepo.save(
      this.characterResourceRepo.create({
        jdrSlug,
        characterSlug,
        resourceSlug,
        name: p.name,
        value: p.value ?? 0
      })
    )
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<void> {
    const definition = await this.resourceRepo.findOne({
      where: { jdrSlug, slug: resourceSlug, ownerType: ResourceOwnerType.CHARACTER }
    })
    if (definition) throw JdrError.conflict(`JdR resource '${resourceSlug}' cannot be removed from a character`)
    await this.characterResourceRepo.delete({ jdrSlug, characterSlug, resourceSlug })
  }

  private async ensureCharacterExists(jdrSlug: string, characterSlug: string): Promise<void> {
    const character = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
    if (!character) throw JdrError.notFound(`Character '${characterSlug}'`)
  }

  private async ensureCharacterClass(jdrSlug: string, classSlug?: string, classLevel?: string): Promise<void> {
    if (classSlug) {
      const existingClass = await this.classRepo.findOne({ where: { jdrSlug, slug: classSlug } })
      if (!existingClass) throw JdrError.notFound(`Class '${classSlug}' in jdr '${jdrSlug}'`)
      if (classLevel && !existingClass.levels.includes(classLevel))
        throw JdrError.badRequest(`Level '${classLevel}' does not exist on class '${classSlug}'`)
    } else if (classLevel) {
      throw JdrError.badRequest(`A character cannot have a class level without a class`)
    }
  }

  private async ensurePlayer(jdrSlug: string, playerSlug?: string): Promise<void> {
    if (playerSlug && !(await this.playerRepo.existsBy({ jdrSlug, slug: playerSlug })))
      throw JdrError.notFound(`Player '${playerSlug}' in jdr '${jdrSlug}'`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Character> {
    const db = await this.characterRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrCharacter.RELATIONS })
    if (!db) throw JdrError.notFound(`Character '${slug}'`)
    return CharacterMapper.toDomain(db)
  }
}
