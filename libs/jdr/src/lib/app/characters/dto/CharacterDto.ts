import { Character } from '../../../domain/characters/Character'
import { Jdr } from '../../../domain/jdr/Jdr'

export class CharacterStatDto {
  statSlug: string
  value: number
  finalValue: number
}

export class CharacterResourceDto {
  resourceSlug: string
  value: number
}

export class OwnedItemDto {
  itemSlug: string
  quantity: number
}

export class CharacterDto {
  slug: string
  name: string
  classSlug: string | null
  groupSlugs: string[]
  classLevel: number
  isPlayable: boolean
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
    dto.groupSlugs = character.groupSlugs
    dto.classLevel = character.classLevel ?? 1
    dto.isPlayable = character.isPlayable
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
