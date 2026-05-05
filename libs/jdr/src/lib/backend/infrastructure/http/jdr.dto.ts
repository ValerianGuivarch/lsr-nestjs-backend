import { DiceRoll, Jdr, Character } from '../../../../../domain/src/index'

export class TraitModifierDto {
  statSlug: string
  value: number
}

export class TraitDto {
  slug: string
  name: string
  type: string
  modifiers: TraitModifierDto[]
}

export class StatDto {
  slug: string
  name: string
}

export class ResourceDto {
  slug: string
  name: string
  type: string
}

export class GroupResourceDto {
  resourceSlug: string
  value: number
}

export class ItemDto {
  slug: string
  name: string
  description: string
  unique: boolean
  traitSlug: string | null
}

export class OwnedItemDto {
  itemSlug: string
  quantity: number
}

export class CharacterStatDto {
  statSlug: string
  value: number
  finalValue: number
}

export class CharacterResourceDto {
  resourceSlug: string
  value: number
}

export class CharacterDto {
  slug: string
  name: string
  classSlug: string | null
  groupSlug: string | null
  text: string
  stats: CharacterStatDto[]
  traitSlugs: string[]
  items: OwnedItemDto[]
  resources: CharacterResourceDto[]

  static from(character: Character, jdr: Jdr): CharacterDto {
    const dto = new CharacterDto()
    dto.slug = character.slug
    dto.name = character.name
    dto.classSlug = character.classSlug ?? null
    dto.groupSlug = character.groupSlug ?? null
    dto.text = character.text
    dto.traitSlugs = character.traitSlugs
    dto.items = character.items.map((i) => ({ itemSlug: i.itemSlug, quantity: i.quantity }))
    dto.resources = character.resources.map((r) => ({ resourceSlug: r.resourceSlug, value: r.value }))

    const finalStats = jdr.computeFinalStats(character.slug)
    dto.stats = character.stats.map((cs) => ({
      statSlug: cs.statSlug,
      value: cs.value,
      finalValue: finalStats.get(cs.statSlug) ?? cs.value
    }))
    return dto
  }
}

export class JdrClassResourceDto {
  resourceSlug: string
  resourceType: string
  defaultValue: number
  behavior: 'fixed' | 'scalable'
}

export class JdrClassDto {
  slug: string
  name: string
  text: string
  level: number
  resources: JdrClassResourceDto[]
}

export class JdrGroupDto {
  slug: string
  name: string
  text: string
}

export class JdrDto {
  slug: string
  name: string
  text: string
  stats: StatDto[]
  traits: TraitDto[]
  resources: ResourceDto[]
  groupResources: GroupResourceDto[]
  items: ItemDto[]
  groupItems: OwnedItemDto[]
  characters: CharacterDto[]
  classes: JdrClassDto[]
  groups: JdrGroupDto[]

  static from(jdr: Jdr): JdrDto {
    const dto = new JdrDto()
    dto.slug = jdr.slug
    dto.name = jdr.name
    dto.text = jdr.text.value
    dto.stats = jdr.stats.map((s) => ({ slug: s.slug, name: s.name }))
    dto.traits = jdr.traits.map((t) => ({
      slug: t.slug,
      name: t.name,
      type: t.type,
      modifiers: t.modifiers.map((m) => ({ statSlug: m.statSlug, value: m.value }))
    }))
    dto.resources = jdr.resources.map((r) => ({ slug: r.slug, name: r.name, type: r.type }))
    dto.groupResources = jdr.groupResources.map((gr) => ({ resourceSlug: gr.resourceSlug, value: gr.value }))
    dto.items = jdr.items.map((i) => ({ slug: i.slug, name: i.name, description: i.description, unique: i.unique, traitSlug: i.traitSlug ?? null }))
    dto.groupItems = jdr.groupItems.map((gi) => ({ itemSlug: gi.itemSlug, quantity: gi.quantity }))
    dto.characters = jdr.characters.map((c) => CharacterDto.from(c, jdr))
    dto.classes = jdr.classes.map((c) => ({
      slug: c.slug,
      name: c.name,
      text: c.text,
      level: c.level,
      resources: c.resources.map((r) => ({
        resourceSlug: r.resourceSlug,
        resourceType: r.resourceType,
        defaultValue: r.defaultValue,
        behavior: r.behavior
      }))
    }))
    dto.groups = jdr.groups.map((g) => ({ slug: g.slug, name: g.name, text: g.text }))
    return dto
  }
}

export class JdrSummaryDto {
  slug: string
  name: string
}

export class DiceRollDto {
  id: string
  jdrSlug: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  results: number[]
  createdDate: Date

  static from(roll: DiceRoll): DiceRollDto {
    const dto = new DiceRollDto()
    dto.id = roll.id
    dto.jdrSlug = roll.jdrSlug
    dto.characterSlug = roll.characterSlug
    dto.characterName = roll.characterName
    dto.statSlug = roll.statSlug
    dto.statName = roll.statName
    dto.statValue = roll.statValue
    dto.results = roll.results
    dto.createdDate = roll.createdDate
    return dto
  }
}
