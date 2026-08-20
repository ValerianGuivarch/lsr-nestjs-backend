import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { Character } from '../../domain/characters/Character'
import { ResourceType } from '../../domain/resources/ResourceType'
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

@Injectable()
export class CharacterProvider implements ICharacterProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>,
    @InjectRepository(DBJdrGroup, 'jdr-sqlite') private readonly groupRepo: Repository<DBJdrGroup>,
    @InjectRepository(DBJdrCharacter, 'jdr-sqlite') private readonly characterRepo: Repository<DBJdrCharacter>,
    @InjectRepository(DBJdrCharacterStat, 'jdr-sqlite') private readonly characterStatRepo: Repository<DBJdrCharacterStat>,
    @InjectRepository(DBJdrCharacterTrait, 'jdr-sqlite') private readonly characterTraitRepo: Repository<DBJdrCharacterTrait>,
    @InjectRepository(DBJdrCharacterItem, 'jdr-sqlite') private readonly characterItemRepo: Repository<DBJdrCharacterItem>,
    @InjectRepository(DBJdrCharacterResource, 'jdr-sqlite') private readonly characterResourceRepo: Repository<DBJdrCharacterResource>,
    @InjectRepository(DBJdrCharacterGroup, 'jdr-sqlite') private readonly characterGroupRepo: Repository<DBJdrCharacterGroup>
  ) {}

  async add(jdrSlug: string, p: { name: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Character> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug }, relations: { stats: true, resources: true } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
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
    for (const stat of jdr.stats ?? []) {
      await this.characterStatRepo.save(this.characterStatRepo.create({ jdrSlug, characterSlug: slug, statSlug: stat.slug, value: 2 }))
    }
    // seed all-type resources
    for (const resource of (jdr.resources ?? []).filter((r) => r.type === ResourceType.ALL)) {
      await this.characterResourceRepo.save(this.characterResourceRepo.create({ jdrSlug, characterSlug: slug, resourceSlug: resource.slug, value: 0 }))
    }
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Character> {
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
    await this.characterTraitRepo.save(this.characterTraitRepo.create({ jdrSlug, characterSlug, traitSlug }))
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<void> {
    await this.characterTraitRepo.delete({ jdrSlug, characterSlug, traitSlug })
  }

  async addCharacterItem(jdrSlug: string, characterSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Character> {
    const existing = await this.characterItemRepo.findOne({ where: { jdrSlug, characterSlug, itemSlug: p.itemSlug } })
    if (existing) throw JdrError.conflict(`Character '${characterSlug}' already owns item '${p.itemSlug}'`)
    await this.characterItemRepo.save(this.characterItemRepo.create({ jdrSlug, characterSlug, itemSlug: p.itemSlug, quantity: p.quantity ?? 1 }))
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<void> {
    await this.characterItemRepo.delete({ jdrSlug, characterSlug, itemSlug })
  }

  async updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Character> {
    const existing = await this.characterStatRepo.findOne({ where: { jdrSlug, characterSlug, statSlug } })
    if (!existing) throw JdrError.notFound(`Stat '${statSlug}' on character '${characterSlug}'`)
    await this.characterStatRepo.update({ jdrSlug, characterSlug, statSlug }, { value })
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<Character> {
    const existing = await this.characterResourceRepo.findOne({ where: { jdrSlug, characterSlug, resourceSlug } })
    if (existing) {
      await this.characterResourceRepo.update({ jdrSlug, characterSlug, resourceSlug }, { value })
    } else {
      await this.characterResourceRepo.save(this.characterResourceRepo.create({ jdrSlug, characterSlug, resourceSlug, value }))
    }
    return this.findOneOrThrow(jdrSlug, characterSlug)
  }

  async removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<void> {
    await this.characterResourceRepo.delete({ jdrSlug, characterSlug, resourceSlug })
  }

  private async ensureCharacterClass(jdrSlug: string, classSlug?: string): Promise<void> {
    if (classSlug) {
      const existingClass = await this.classRepo.findOne({ where: { jdrSlug, slug: classSlug } })
      if (!existingClass) throw JdrError.notFound(`Class '${classSlug}' in jdr '${jdrSlug}'`)
    }
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<Character> {
    const db = await this.characterRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrCharacter.RELATIONS })
    if (!db) throw JdrError.notFound(`Character '${slug}'`)
    return CharacterMapper.toDomain(db)
  }
}
