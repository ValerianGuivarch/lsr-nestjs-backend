import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { DiceRoll, Jdr, ResourceType, Slug, TraitType } from '../../../../domain/src/index'
import { IJdrProvider } from '../domain/ports/jdr.provider'
import { JdrError } from '../errors/JdrError'
import { DraftDto } from './http/jdr.dto'
import { DBJdr } from './persistence/jdr.db'
import { DBJdrStat } from './persistence/jdr-stat.db'
import { DBJdrTrait } from './persistence/jdr-trait.db'
import { DBJdrTraitModifier } from './persistence/jdr-trait-modifier.db'
import { DBJdrResource } from './persistence/jdr-resource.db'
import { DBJdrGroupResource } from './persistence/jdr-group-resource.db'
import { DBJdrItem } from './persistence/jdr-item.db'
import { DBJdrGroupItem } from './persistence/jdr-group-item.db'
import { DBJdrCharacter } from './persistence/jdr-character.db'
import { DBJdrCharacterStat } from './persistence/jdr-character-stat.db'
import { DBJdrCharacterTrait } from './persistence/jdr-character-trait.db'
import { DBJdrCharacterItem } from './persistence/jdr-character-item.db'
import { DBJdrCharacterResource } from './persistence/jdr-character-resource.db'
import { DBJdrCharacterGroup } from './persistence/jdr-character-group.db'
import { DBJdrDiceRoll } from './persistence/jdr-dice-roll.db'
import { DBJdrClass } from './persistence/jdr-class.db'
import { DBJdrGroup } from './persistence/jdr-group.db'
import { DBJdrClassResource } from './persistence/jdr-class-resource.db'
import { DBJdrDraft } from './persistence/jdr-draft.db'

@Injectable()
export class JdrImplementation implements IJdrProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrStat, 'jdr-sqlite') private readonly statRepo: Repository<DBJdrStat>,
    @InjectRepository(DBJdrTrait, 'jdr-sqlite') private readonly traitRepo: Repository<DBJdrTrait>,
    @InjectRepository(DBJdrTraitModifier, 'jdr-sqlite') private readonly traitModifierRepo: Repository<DBJdrTraitModifier>,
    @InjectRepository(DBJdrResource, 'jdr-sqlite') private readonly resourceRepo: Repository<DBJdrResource>,
    @InjectRepository(DBJdrGroupResource, 'jdr-sqlite') private readonly groupResourceRepo: Repository<DBJdrGroupResource>,
    @InjectRepository(DBJdrItem, 'jdr-sqlite') private readonly itemRepo: Repository<DBJdrItem>,
    @InjectRepository(DBJdrGroupItem, 'jdr-sqlite') private readonly groupItemRepo: Repository<DBJdrGroupItem>,
    @InjectRepository(DBJdrCharacter, 'jdr-sqlite') private readonly characterRepo: Repository<DBJdrCharacter>,
    @InjectRepository(DBJdrCharacterStat, 'jdr-sqlite') private readonly characterStatRepo: Repository<DBJdrCharacterStat>,
    @InjectRepository(DBJdrCharacterTrait, 'jdr-sqlite') private readonly characterTraitRepo: Repository<DBJdrCharacterTrait>,
    @InjectRepository(DBJdrCharacterItem, 'jdr-sqlite') private readonly characterItemRepo: Repository<DBJdrCharacterItem>,
    @InjectRepository(DBJdrCharacterResource, 'jdr-sqlite') private readonly characterResourceRepo: Repository<DBJdrCharacterResource>,
    @InjectRepository(DBJdrCharacterGroup, 'jdr-sqlite') private readonly characterGroupRepo: Repository<DBJdrCharacterGroup>,
    @InjectRepository(DBJdrDiceRoll, 'jdr-sqlite') private readonly diceRollRepo: Repository<DBJdrDiceRoll>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrClassResource, 'jdr-sqlite') private readonly classResourceRepo: Repository<DBJdrClassResource>,
    @InjectRepository(DBJdrDraft, 'jdr-sqlite') private readonly draftRepo: Repository<DBJdrDraft>
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async loadJdr(jdrSlug: string): Promise<DBJdr> {
    const db = await this.jdrRepo.findOne({
      where: { slug: jdrSlug },
      relations: DBJdr.RELATIONS,
      relationLoadStrategy: 'query'
    })
    if (!db) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    return db
  }

  private async ensureCharacterClass(jdrSlug: string, classSlug?: string): Promise<void> {
    if (classSlug) {
      const existingClass = await this.classRepo.findOne({ where: { jdrSlug, slug: classSlug } })
      if (!existingClass) throw JdrError.notFound(`Class '${classSlug}' in jdr '${jdrSlug}'`)
    }
  }

  private toDraftDto(db: DBJdrDraft): DraftDto {
    const dto = new DraftDto()
    dto.id = db.id
    dto.name = db.name
    dto.jdrSlug = db.jdrSlug
    dto.groupSlug = db.groupSlug
    dto.traitType = db.traitType
    dto.selectedTraitSlugs = JSON.parse(db.selectedTraitSlugsJson || '[]')
    dto.characterOrder = JSON.parse(db.characterOrderJson || '[]')
    dto.currentHandsByCharacter = JSON.parse(db.handsByCharacterJson || '{}')
    dto.totalRounds = db.totalRounds
    dto.currentRound = db.currentRound
    dto.status = db.status

    const picksByRound: Record<number, Record<string, string>> = JSON.parse(db.picksJson || '{}')
    dto.rounds = dto.status === 'pending'
      ? []
      : Array.from({ length: dto.totalRounds }, (_, index) => index + 1).map((round) => ({
          round,
          availableTraitSlugs: dto.selectedTraitSlugs,
          picks: picksByRound[round] ?? {}
        }))

    return dto
  }

  // ─── JdR ──────────────────────────────────────────────────────────────────

  async findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]> {
    return this.jdrRepo.find({ select: ['slug', 'name'] })
  }

  async findOneBySlug(jdrSlug: string): Promise<Jdr> {
    return DBJdr.toJdr(await this.loadJdr(jdrSlug))
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

  // ─── Stats ────────────────────────────────────────────────────────────────

  async addStat(jdrSlug: string, p: { name: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.statRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Stat '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.statRepo.save(this.statRepo.create({ jdrSlug, slug, name: p.name }))
    return this.findOneBySlug(jdrSlug)
  }

  async updateStat(jdrSlug: string, statSlug: string, p: { name: string }): Promise<Jdr> {
    await this.statRepo.update({ jdrSlug, slug: statSlug }, { name: p.name })
    return this.findOneBySlug(jdrSlug)
  }

  async removeStat(jdrSlug: string, statSlug: string): Promise<Jdr> {
    await this.statRepo.delete({ jdrSlug, slug: statSlug })
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Traits ───────────────────────────────────────────────────────────────

  async addTrait(jdrSlug: string, p: { name: string; type: string; level?: number; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.traitRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Trait '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.traitRepo.save(this.traitRepo.create({ jdrSlug, slug, name: p.name, type: p.type as TraitType, level: p.level ?? null, data: p.data ?? null }))
    for (const modifier of p.modifiers ?? []) {
      await this.traitModifierRepo.save(this.traitModifierRepo.create({ jdrSlug, traitSlug: slug, statSlug: modifier.statSlug, value: modifier.value }))
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeTrait(jdrSlug: string, traitSlug: string): Promise<Jdr> {
    await this.traitModifierRepo.delete({ jdrSlug, traitSlug })
    await this.traitRepo.delete({ jdrSlug, slug: traitSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async updateTrait(jdrSlug: string, traitSlug: string, p: { name?: string; type?: string; level?: number | null; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
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
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Resources ────────────────────────────────────────────────────────────

  async addResource(jdrSlug: string, p: { name: string; type: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.resourceRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Resource '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.resourceRepo.save(this.resourceRepo.create({ jdrSlug, slug, name: p.name, type: p.type as ResourceType }))
    if ((p.type as ResourceType) === ResourceType.GROUP) {
      await this.groupResourceRepo.save(this.groupResourceRepo.create({ jdrSlug, resourceSlug: slug, value: 0 }))
    }
    return this.findOneBySlug(jdrSlug)
  }

  async updateResource(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<Jdr> {
    const updates: Record<string, unknown> = {}
    if (p.name) updates.name = p.name
    if (p.type) updates.type = p.type
    if (Object.keys(updates).length > 0) {
      await this.resourceRepo.update({ jdrSlug, slug: resourceSlug }, updates)
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeResource(jdrSlug: string, resourceSlug: string): Promise<Jdr> {
    await this.resourceRepo.delete({ jdrSlug, slug: resourceSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<Jdr> {
    const existing = await this.groupResourceRepo.findOne({ where: { jdrSlug, resourceSlug } })
    if (existing) {
      await this.groupResourceRepo.update({ jdrSlug, resourceSlug }, { value })
    } else {
      await this.groupResourceRepo.save(this.groupResourceRepo.create({ jdrSlug, resourceSlug, value }))
    }
    return this.findOneBySlug(jdrSlug)
  }

  async addClass(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.classRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Class '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.classRepo.save(
      this.classRepo.create({
        jdrSlug,
        slug,
        name: p.name,
        text: p.text ?? '',
        level: p.level
      })
    )
    return this.findOneBySlug(jdrSlug)
  }

  async updateClass(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<Jdr> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.level !== undefined) updates.level = p.level
    if (p.text !== undefined) updates.text = p.text
    if (Object.keys(updates).length > 0) {
      await this.classRepo.update({ jdrSlug, slug: classSlug }, updates)
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeClass(jdrSlug: string, classSlug: string): Promise<Jdr> {
    await this.classRepo.delete({ jdrSlug, slug: classSlug })
    await this.classResourceRepo.delete({ jdrSlug, classSlug })
    await this.characterRepo.update({ jdrSlug, classSlug }, { classSlug: null })
    return this.findOneBySlug(jdrSlug)
  }

  async addClassResource(jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }): Promise<Jdr> {
    const clazz = await this.classRepo.findOne({ where: { jdrSlug, slug: classSlug } })
    if (!clazz) throw JdrError.notFound(`Class '${classSlug}'`)
    const existing = await this.classResourceRepo.findOne({ where: { jdrSlug, classSlug, resourceSlug: p.resourceSlug } })
    if (existing) throw JdrError.conflict(`ClassResource '${p.resourceSlug}' already exists on class '${classSlug}'`)
    await this.classResourceRepo.save(
      this.classResourceRepo.create({
        jdrSlug,
        classSlug,
        resourceSlug: p.resourceSlug,
        resourceType: p.resourceType,
        defaultValue: p.defaultValue ?? 0,
        behavior: (p.behavior ?? 'fixed') as 'fixed' | 'scalable'
      })
    )
    return this.findOneBySlug(jdrSlug)
  }

  async removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<Jdr> {
    await this.classResourceRepo.delete({ jdrSlug, classSlug, resourceSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async addGroup(jdrSlug: string, p: { name: string; text?: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.groupRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Group '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.groupRepo.save(
      this.groupRepo.create({
        jdrSlug,
        slug,
        name: p.name,
        text: p.text ?? ''
      })
    )
    return this.findOneBySlug(jdrSlug)
  }

  async updateGroup(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<Jdr> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.text !== undefined) updates.text = p.text
    if (Object.keys(updates).length > 0) {
      await this.groupRepo.update({ jdrSlug, slug: groupSlug }, updates)
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeGroup(jdrSlug: string, groupSlug: string): Promise<Jdr> {
    await this.characterGroupRepo.delete({ jdrSlug, groupSlug })
    await this.groupRepo.delete({ jdrSlug, slug: groupSlug })
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Items ────────────────────────────────────────────────────────────────

  async addItem(jdrSlug: string, p: { name: string; description?: string; unique?: boolean; traitSlug?: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.itemRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Item '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.itemRepo.save(this.itemRepo.create({
      jdrSlug,
      slug,
      name: p.name,
      description: p.description ?? '',
      unique: p.unique ?? true,
      traitSlug: p.traitSlug ?? null
    }))
    return this.findOneBySlug(jdrSlug)
  }

  async updateItem(jdrSlug: string, itemSlug: string, p: { name?: string; description?: string; unique?: boolean }): Promise<Jdr> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.description !== undefined) updates.description = p.description
    if (p.unique !== undefined) updates.unique = p.unique
    if (Object.keys(updates).length > 0) {
      await this.itemRepo.update({ jdrSlug, slug: itemSlug }, updates)
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeItem(jdrSlug: string, itemSlug: string): Promise<Jdr> {
    await this.itemRepo.delete({ jdrSlug, slug: itemSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr> {
    const existing = await this.groupItemRepo.findOne({ where: { jdrSlug, itemSlug: p.itemSlug } })
    if (existing) throw JdrError.conflict(`Group already owns item '${p.itemSlug}' in jdr '${jdrSlug}'`)
    await this.groupItemRepo.save(this.groupItemRepo.create({ jdrSlug, itemSlug: p.itemSlug, quantity: p.quantity ?? 1 }))
    return this.findOneBySlug(jdrSlug)
  }

  async removeGroupItem(jdrSlug: string, itemSlug: string): Promise<Jdr> {
    await this.groupItemRepo.delete({ jdrSlug, itemSlug })
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Characters ───────────────────────────────────────────────────────────

  async addCharacter(jdrSlug: string, p: { name: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Jdr> {
    const db = await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Character '${slug}' already exists in jdr '${jdrSlug}'`)

    const classSlug = p.classSlug || undefined
    await this.ensureCharacterClass(jdrSlug, classSlug)
    await this.characterRepo.save(this.characterRepo.create({
      jdrSlug,
      slug,
      name: p.name,
      classSlug: classSlug ?? null,
      groupSlug: null,
      classLevel: p.classLevel ?? 1,
      isPlayable: p.isPlayable ?? false,
      text: p.text ?? ''
    }))
    // seed stats with default value 2 for each stat of the jdr
    for (const stat of db.stats ?? []) {
      await this.characterStatRepo.save(this.characterStatRepo.create({ jdrSlug, characterSlug: slug, statSlug: stat.slug, value: 2 }))
    }
    // seed all-type resources
    for (const resource of (db.resources ?? []).filter((r) => r.type === ResourceType.ALL)) {
      await this.characterResourceRepo.save(this.characterResourceRepo.create({ jdrSlug, characterSlug: slug, resourceSlug: resource.slug, value: 0 }))
    }
    return this.findOneBySlug(jdrSlug)
  }

  async updateCharacter(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Jdr> {
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
    if (!existing) throw JdrError.notFound(`Character '${characterSlug}'`)

    const classSlug = p.classSlug === undefined ? undefined : (p.classSlug || undefined)
    await this.ensureCharacterClass(jdrSlug, classSlug)

    const patch: { name?: string; text?: string; classSlug?: string | null; classLevel?: number; isPlayable?: boolean; updatedDate: Date } = {
      updatedDate: new Date()
    }
    if (p.name !== undefined) patch.name = p.name
    if (p.text !== undefined) patch.text = p.text
    if (p.classSlug !== undefined) patch.classSlug = classSlug ?? null
    if (p.classLevel !== undefined) patch.classLevel = p.classLevel
    if (p.isPlayable !== undefined) patch.isPlayable = p.isPlayable

    await this.characterRepo.update(
      { jdrSlug, slug: characterSlug },
      patch
    )
    return this.findOneBySlug(jdrSlug)
  }

  async removeCharacter(jdrSlug: string, characterSlug: string): Promise<Jdr> {
    await this.characterRepo.delete({ jdrSlug, slug: characterSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Jdr> {
    const existing = await this.characterGroupRepo.findOne({ where: { jdrSlug, characterSlug, groupSlug } })
    if (existing) return this.findOneBySlug(jdrSlug)
    const group = await this.groupRepo.findOne({ where: { jdrSlug, slug: groupSlug } })
    if (!group) throw JdrError.notFound(`Group '${groupSlug}' in jdr '${jdrSlug}'`)
    const character = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
    if (!character) throw JdrError.notFound(`Character '${characterSlug}'`)
    await this.characterGroupRepo.save(this.characterGroupRepo.create({ jdrSlug, characterSlug, groupSlug }))
    return this.findOneBySlug(jdrSlug)
  }

  async removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Jdr> {
    await this.characterGroupRepo.delete({ jdrSlug, characterSlug, groupSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr> {
    const existing = await this.characterTraitRepo.findOne({ where: { jdrSlug, characterSlug, traitSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already has trait '${traitSlug}'`)
    await this.characterTraitRepo.save(this.characterTraitRepo.create({ jdrSlug, characterSlug, traitSlug }))
    return this.findOneBySlug(jdrSlug)
  }

  async removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr> {
    await this.characterTraitRepo.delete({ jdrSlug, characterSlug, traitSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async addCharacterItem(jdrSlug: string, characterSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr> {
    const existing = await this.characterItemRepo.findOne({ where: { jdrSlug, characterSlug, itemSlug: p.itemSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already owns item '${p.itemSlug}'`)
    await this.characterItemRepo.save(this.characterItemRepo.create({ jdrSlug, characterSlug, itemSlug: p.itemSlug, quantity: p.quantity ?? 1 }))
    return this.findOneBySlug(jdrSlug)
  }

  async removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<Jdr> {
    await this.characterItemRepo.delete({ jdrSlug, characterSlug, itemSlug })
    return this.findOneBySlug(jdrSlug)
  }

  async updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Jdr> {
    const existing = await this.characterStatRepo.findOne({ where: { jdrSlug, characterSlug, statSlug } })
    if (!existing) throw JdrError.notFound(`Stat '${statSlug}' on character '${characterSlug}'`)
    await this.characterStatRepo.update({ jdrSlug, characterSlug, statSlug }, { value })
    return this.findOneBySlug(jdrSlug)
  }

  async updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<Jdr> {
    const existing = await this.characterResourceRepo.findOne({ where: { jdrSlug, characterSlug, resourceSlug } })
    if (existing) {
      await this.characterResourceRepo.update({ jdrSlug, characterSlug, resourceSlug }, { value })
    } else {
      await this.characterResourceRepo.save(this.characterResourceRepo.create({ jdrSlug, characterSlug, resourceSlug, value }))
    }
    return this.findOneBySlug(jdrSlug)
  }

  async removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<Jdr> {
    await this.characterResourceRepo.delete({ jdrSlug, characterSlug, resourceSlug })
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Dice Rolls ───────────────────────────────────────────────────────────

  async rollDice(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    rollState: DiceRoll['rollState'] = 'normal',
    text?: string | null
  ): Promise<DiceRoll> {
    const jdr = await this.loadJdr(jdrSlug)
    const domainJdr = DBJdr.toJdr(jdr)

    const character = domainJdr.characters.find((c) => c.slug === characterSlug)
    if (!character) throw JdrError.notFound(`Character ${characterSlug}`)

    const stat = domainJdr.stats.find((s) => s.slug === statSlug)
    if (!stat) throw JdrError.notFound(`Stat ${statSlug}`)

    const finalStats = domainJdr.computeFinalStats(characterSlug)
    const statValue = Math.max(0, finalStats.get(statSlug) ?? 0)
    const results = Array.from({ length: statValue }, () => Math.floor(Math.random() * 6) + 1)

    const saved = await this.diceRollRepo.save(
      this.diceRollRepo.create({
        jdrSlug,
        characterSlug,
        characterName: character.name,
        statSlug,
        statName: stat.name,
        statValue,
        rollState,
        results,
        text: text ?? null
      })
    )
    return DBJdrDiceRoll.toDiceRoll(saved)
  }

  async rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRoll> {
    const jdr = await this.loadJdr(jdrSlug)
    const domainJdr = DBJdr.toJdr(jdr)
    const character = domainJdr.characters.find((c) => c.slug === characterSlug)
    if (!character) throw JdrError.notFound(`Character ${characterSlug}`)

    const match = /^(\d+)d(\d+)$/i.exec(formula.trim())
    if (!match) throw JdrError.badRequest(`Invalid formula: ${formula}. Expected format XdX (e.g. 2d6, 1d20)`)
    const count = Math.min(50, parseInt(match[1], 10))
    const faces = Math.min(1000, parseInt(match[2], 10))
    const results = Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1)

    const saved = await this.diceRollRepo.save(
      this.diceRollRepo.create({
        jdrSlug,
        characterSlug,
        characterName: character.name,
        statSlug: 'arbitrary',
        statName: formula.toLowerCase().trim(),
        statValue: faces,
        rollState: 'normal',
        isArbitrary: true,
        formula: formula.toLowerCase().trim(),
        results
      })
    )
    return DBJdrDiceRoll.toDiceRoll(saved)
  }

  async getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]> {
    const rows = await this.diceRollRepo.find({
      where: { jdrSlug },
      order: { createdDate: 'DESC' },
      take: size
    })
    return rows.map(DBJdrDiceRoll.toDiceRoll)
  }

  private buildDraftTraitPool(jdr: Jdr, p: { traitType?: string; traitSlugs?: string[] }): { traitType: string; traitSlugs: string[] } {
    const selectedTraitSlugs = (p.traitSlugs ?? []).filter(Boolean)
    if (selectedTraitSlugs.length > 0) {
      return {
        traitType: p.traitType || 'Manuel',
        traitSlugs: selectedTraitSlugs
      }
    }

    const traitType = p.traitType || 'Normal'
    return {
      traitType,
      traitSlugs: jdr.traits.filter((trait) => trait.type === traitType).map((trait) => trait.slug)
    }
  }

  private async finalizeDraftRound(
    draft: DBJdrDraft,
    characterOrder: string[],
    handsByCharacter: Record<string, string[]>,
    roundPicks: Record<string, string>
  ): Promise<void> {
    for (const characterSlug of characterOrder) {
      const pickedTrait = roundPicks[characterSlug]
      if (!pickedTrait || pickedTrait === '__pass__') continue
      const exists = await this.characterTraitRepo.findOne({ where: { jdrSlug: draft.jdrSlug, characterSlug, traitSlug: pickedTrait } })
      if (!exists) {
        await this.characterTraitRepo.save(this.characterTraitRepo.create({ jdrSlug: draft.jdrSlug, characterSlug, traitSlug: pickedTrait }))
      }
    }

    for (const characterSlug of characterOrder) {
      const pickedTrait = roundPicks[characterSlug]
      if (!pickedTrait || pickedTrait === '__pass__') continue
      handsByCharacter[characterSlug] = (handsByCharacter[characterSlug] ?? []).filter((slug) => slug !== pickedTrait)
    }

    const rotatedHands: Record<string, string[]> = {}
    for (let i = 0; i < characterOrder.length; i++) {
      const receiver = characterOrder[i]
      const giver = characterOrder[(i - 1 + characterOrder.length) % characterOrder.length]
      rotatedHands[receiver] = handsByCharacter[giver] ?? []
    }

    draft.currentRound += 1
    if (draft.currentRound > draft.totalRounds) {
      draft.status = 'completed'
      draft.currentRound = draft.totalRounds
    }

    draft.handsByCharacterJson = JSON.stringify(rotatedHands)
  }

  async createDraft(jdrSlug: string, p: { name: string; groupSlug: string; traitType?: string; traitSlugs?: string[]; rounds: number }): Promise<DraftDto> {
    const existing = await this.draftRepo.findOne({ where: { jdrSlug, status: 'pending' } })
    if (existing) throw JdrError.conflict('Un template de draft existe deja pour ce JdR')

    const jdr = await this.findOneBySlug(jdrSlug)
    const characterOrder = jdr.characters.filter((c) => c.groupSlugs.includes(p.groupSlug)).map((c) => c.slug)
    if (characterOrder.length < 2) throw JdrError.conflict('Le groupe doit contenir au moins 2 personnages')

    const pool = this.buildDraftTraitPool(jdr, p)

    const totalRounds = Math.max(1, Math.floor(p.rounds || 1))

    const created = await this.draftRepo.save(
      this.draftRepo.create({
        id: randomUUID(),
        name: p.name?.trim() || 'Sans nom',
        jdrSlug,
        groupSlug: p.groupSlug,
        traitType: pool.traitType,
        selectedTraitSlugsJson: JSON.stringify(pool.traitSlugs),
        characterOrderJson: JSON.stringify([]),
        poolByRoundJson: JSON.stringify(pool.traitSlugs),
        handsByCharacterJson: JSON.stringify({}),
        picksJson: JSON.stringify({}),
        totalRounds,
        currentRound: 0,
        status: 'pending'
      })
    )

    return this.toDraftDto(created)
  }

  async getDrafts(jdrSlug: string): Promise<DraftDto[]> {
    const drafts = await this.draftRepo.find({
      where: { jdrSlug },
      order: { updatedDate: 'DESC' }
    })
    return drafts.map((draft) => this.toDraftDto(draft))
  }

  async updateDraft(jdrSlug: string, draftId: string, p: { name?: string; groupSlug?: string; traitType?: string; traitSlugs?: string[]; rounds?: number }): Promise<DraftDto> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, id: draftId } })
    if (!draft) throw JdrError.notFound('Draft introuvable')
    if (draft.status !== 'pending') throw JdrError.conflict('Le draft ne peut plus etre modifie une fois lance')

    const jdr = await this.findOneBySlug(jdrSlug)
    const pool = this.buildDraftTraitPool(jdr, p)

    if (p.name !== undefined) draft.name = p.name.trim() || draft.name
    if (p.groupSlug) draft.groupSlug = p.groupSlug
    draft.traitType = pool.traitType
    draft.selectedTraitSlugsJson = JSON.stringify(pool.traitSlugs)
    draft.poolByRoundJson = JSON.stringify(pool.traitSlugs)
    draft.characterOrderJson = JSON.stringify([])
    draft.handsByCharacterJson = JSON.stringify({})
    draft.picksJson = JSON.stringify({})
    draft.totalRounds = Math.max(1, Math.floor(p.rounds || draft.totalRounds || 1))
    draft.currentRound = 0
    draft.updatedDate = new Date()

    const saved = await this.draftRepo.save(draft)
    return this.toDraftDto(saved)
  }

  async deleteDraft(jdrSlug: string, draftId: string): Promise<void> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, id: draftId } })
    if (!draft) return
    if (draft.status === 'active') {
      throw JdrError.conflict('Le draft doit etre arrete avant suppression')
    }
    await this.draftRepo.delete({ jdrSlug, id: draftId })
  }

  async launchDraft(jdrSlug: string, draftId: string): Promise<DraftDto> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, id: draftId } })
    if (!draft) throw JdrError.notFound('Draft introuvable')
    if (draft.status !== 'pending') throw JdrError.conflict('Seul un draft en attente peut etre lance')

    const activeExisting = await this.draftRepo.findOne({ where: { jdrSlug, status: 'active' } })
    if (activeExisting) throw JdrError.conflict('Un draft est deja en cours')

    const jdr = await this.findOneBySlug(jdrSlug)
    const characterOrder = jdr.characters.filter((c) => c.groupSlugs.includes(draft.groupSlug)).map((c) => c.slug)
    if (characterOrder.length < 2) throw JdrError.conflict('Le groupe doit contenir au moins 2 personnages')

    const selectedTraitSlugs = JSON.parse(draft.selectedTraitSlugsJson || '[]') as string[]
    const traits = selectedTraitSlugs
      .map((slug) => jdr.traits.find((trait) => trait.slug === slug))
      .filter((trait): trait is typeof jdr.traits[number] => Boolean(trait))
    if (traits.length === 0) throw JdrError.conflict('Aucun trait disponible pour ce draft')

    const requiredCards = characterOrder.length * Math.max(1, draft.totalRounds || 1)
    if (traits.length < requiredCards) {
      throw JdrError.conflict(`Pas assez de traits: ${traits.length} disponibles, ${requiredCards} requis`)
    }

    const shuffled = [...traits].sort(() => Math.random() - 0.5)
    const handsByCharacter: Record<string, string[]> = Object.fromEntries(characterOrder.map((slug) => [slug, []]))
    for (let i = 0; i < shuffled.length; i++) {
      const owner = characterOrder[i % characterOrder.length]
      handsByCharacter[owner].push(shuffled[i].slug)
    }

    draft.characterOrderJson = JSON.stringify(characterOrder)
    draft.handsByCharacterJson = JSON.stringify(handsByCharacter)
    draft.picksJson = JSON.stringify({})
    draft.poolByRoundJson = JSON.stringify(selectedTraitSlugs)
    draft.currentRound = 1
    draft.status = 'active'
    draft.updatedDate = new Date()

    const saved = await this.draftRepo.save(draft)
    return this.toDraftDto(saved)
  }

  async getActiveDraft(jdrSlug: string): Promise<DraftDto | null> {
    const existing = await this.draftRepo.findOne({
      where: { jdrSlug, status: In(['active', 'completed']) },
      order: { updatedDate: 'DESC' }
    })
    return existing ? this.toDraftDto(existing) : null
  }

  async pickDraft(jdrSlug: string, p: { characterSlug: string; traitSlug: string }): Promise<DraftDto> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, status: 'active' } })
    if (!draft) throw JdrError.notFound('Draft actif introuvable')

    const characterOrder: string[] = JSON.parse(draft.characterOrderJson || '[]')
    if (!characterOrder.includes(p.characterSlug)) throw JdrError.conflict('Personnage non autorise dans ce draft')

    const handsByCharacter: Record<string, string[]> = JSON.parse(draft.handsByCharacterJson || '{}')
    const picksByRound: Record<number, Record<string, string>> = JSON.parse(draft.picksJson || '{}')
    const currentRound = draft.currentRound

    const currentHand = handsByCharacter[p.characterSlug] ?? []
    if (!currentHand.includes(p.traitSlug)) throw JdrError.conflict('Trait non disponible dans la main du personnage')

    const roundPicks = picksByRound[currentRound] ?? {}
    const previousPick = roundPicks[p.characterSlug]
    if (previousPick === p.traitSlug) return this.toDraftDto(draft)
    if (previousPick) {
      delete roundPicks[p.characterSlug]
    }
    if (Object.values(roundPicks).includes(p.traitSlug)) throw JdrError.conflict('Trait deja choisi par une autre joueuse')

    roundPicks[p.characterSlug] = p.traitSlug
    picksByRound[currentRound] = roundPicks

    const everyonePicked = characterOrder.every((characterSlug) => Boolean(roundPicks[characterSlug]))

    if (everyonePicked) {
      await this.finalizeDraftRound(draft, characterOrder, handsByCharacter, roundPicks)
    }

    draft.picksJson = JSON.stringify(picksByRound)
    if (!everyonePicked) {
      draft.handsByCharacterJson = JSON.stringify(handsByCharacter)
    }
    draft.updatedDate = new Date()
    const saved = await this.draftRepo.save(draft)
    return this.toDraftDto(saved)
  }

  async passDraft(jdrSlug: string, p: { characterSlug: string }): Promise<DraftDto> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, status: 'active' } })
    if (!draft) throw JdrError.notFound('Draft actif introuvable')

    const characterOrder: string[] = JSON.parse(draft.characterOrderJson || '[]')
    if (!characterOrder.includes(p.characterSlug)) throw JdrError.conflict('Personnage non autorise dans ce draft')

    const picksByRound: Record<number, Record<string, string>> = JSON.parse(draft.picksJson || '{}')
    const roundPicks = picksByRound[draft.currentRound] ?? {}
    roundPicks[p.characterSlug] = '__pass__'
    picksByRound[draft.currentRound] = roundPicks

    const everyonePicked = characterOrder.every((characterSlug) => Boolean(roundPicks[characterSlug]))
    if (everyonePicked) {
      const handsByCharacter: Record<string, string[]> = JSON.parse(draft.handsByCharacterJson || '{}')
      await this.finalizeDraftRound(draft, characterOrder, handsByCharacter, roundPicks)
    }

    draft.picksJson = JSON.stringify(picksByRound)
    draft.updatedDate = new Date()
    const saved = await this.draftRepo.save(draft)
    return this.toDraftDto(saved)
  }

  async closeDraft(jdrSlug: string): Promise<void> {
    const draft = await this.draftRepo.findOne({ where: { jdrSlug, status: 'active' } })
    if (!draft) return
    draft.status = 'cancelled'
    draft.updatedDate = new Date()
    await this.draftRepo.save(draft)
  }
}
