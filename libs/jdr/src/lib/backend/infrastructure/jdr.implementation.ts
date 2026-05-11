import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DiceRoll, Jdr, ResourceType, Slug, TraitType } from '../../../../domain/src/index'
import { IJdrProvider } from '../domain/ports/jdr.provider'
import { JdrError } from '../errors/JdrError'
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
import { DBJdrDiceRoll } from './persistence/jdr-dice-roll.db'
import { DBJdrClass } from './persistence/jdr-class.db'
import { DBJdrGroup } from './persistence/jdr-group.db'
import { DBJdrClassResource } from './persistence/jdr-class-resource.db'

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
    @InjectRepository(DBJdrDiceRoll, 'jdr-sqlite') private readonly diceRollRepo: Repository<DBJdrDiceRoll>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrClassResource, 'jdr-sqlite') private readonly classResourceRepo: Repository<DBJdrClassResource>
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async loadJdr(jdrSlug: string): Promise<DBJdr> {
    const db = await this.jdrRepo.findOne({ where: { slug: jdrSlug }, relations: DBJdr.RELATIONS })
    if (!db) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    return db
  }

  private async ensureCharacterClassAndGroup(jdrSlug: string, p: { classSlug?: string; groupSlug?: string }): Promise<void> {
    if (p.classSlug) {
      const existingClass = await this.classRepo.findOne({ where: { jdrSlug, slug: p.classSlug } })
      if (!existingClass) throw JdrError.notFound(`Class '${p.classSlug}'`)
    }

    if (p.groupSlug) {
      const existingGroup = await this.groupRepo.findOne({ where: { jdrSlug, slug: p.groupSlug } })
      if (!existingGroup) throw JdrError.notFound(`Group '${p.groupSlug}'`)
    }
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

  async removeStat(jdrSlug: string, statSlug: string): Promise<Jdr> {
    await this.statRepo.delete({ jdrSlug, slug: statSlug })
    return this.findOneBySlug(jdrSlug)
  }

  // ─── Traits ───────────────────────────────────────────────────────────────

  async addTrait(jdrSlug: string, p: { name: string; type: string; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.traitRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Trait '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.traitRepo.save(this.traitRepo.create({ jdrSlug, slug, name: p.name, type: p.type as TraitType }))
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

  // ─── Resources ────────────────────────────────────────────────────────────

  async addResource(jdrSlug: string, p: { name: string; type: string }): Promise<Jdr> {
    await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.resourceRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Resource '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.resourceRepo.save(this.resourceRepo.create({ jdrSlug, slug, name: p.name, type: p.type as ResourceType }))
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

  async removeGroup(jdrSlug: string, groupSlug: string): Promise<Jdr> {
    await this.groupRepo.delete({ jdrSlug, slug: groupSlug })
    await this.characterRepo.update({ jdrSlug, groupSlug }, { groupSlug: null })
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

  async addCharacter(jdrSlug: string, p: { name: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr> {
    const db = await this.loadJdr(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Character '${slug}' already exists in jdr '${jdrSlug}'`)

    const classSlug = p.classSlug || undefined
    const groupSlug = p.groupSlug || undefined

    await this.ensureCharacterClassAndGroup(jdrSlug, { classSlug, groupSlug })
    await this.characterRepo.save(this.characterRepo.create({
      jdrSlug,
      slug,
      name: p.name,
      classSlug: classSlug ?? null,
      groupSlug: groupSlug ?? null,
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

  async updateCharacter(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr> {
    const existing = await this.characterRepo.findOne({ where: { jdrSlug, slug: characterSlug } })
    if (!existing) throw JdrError.notFound(`Character '${characterSlug}'`)

    const classSlug = p.classSlug === undefined ? undefined : (p.classSlug || undefined)
    const groupSlug = p.groupSlug === undefined ? undefined : (p.groupSlug || undefined)

    await this.ensureCharacterClassAndGroup(jdrSlug, { classSlug, groupSlug })

    const patch: { name?: string; text?: string; classSlug?: string | null; groupSlug?: string | null; updatedDate: Date } = {
      updatedDate: new Date()
    }
    if (p.name !== undefined) patch.name = p.name
    if (p.text !== undefined) patch.text = p.text
    if (p.classSlug !== undefined) patch.classSlug = classSlug ?? null
    if (p.groupSlug !== undefined) patch.groupSlug = groupSlug ?? null

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

  // ─── Dice Rolls ───────────────────────────────────────────────────────────

  async rollDice(jdrSlug: string, characterSlug: string, statSlug: string): Promise<DiceRoll> {
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
}
