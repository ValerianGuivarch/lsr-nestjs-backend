import { Jdr } from '../../../domain/jdr/Jdr'
import { StatDto } from '../../stats/dto/StatDto'
import { TraitDto } from '../../traits/dto/TraitDto'
import { ResourceDto, GroupResourceDto } from '../../resources/dto/ResourceDto'
import { ItemDto, OwnedItemDto } from '../../items/dto/ItemDto'
import { CharacterDto } from '../../characters/dto/CharacterDto'
import { JdrClassDto } from '../../classes/dto/ClassDto'
import { JdrGroupDto } from '../../groups/dto/GroupDto'

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
    dto.traits = jdr.traits.map((t) => TraitDto.from(t))
    dto.resources = jdr.resources.map((r) => ({ slug: r.slug, name: r.name, type: r.type }))
    dto.groupResources = jdr.groupResources.map((gr) => ({ resourceSlug: gr.resourceSlug, value: gr.value }))
    dto.items = jdr.items.map((i) => ({ slug: i.slug, name: i.name, description: i.description, unique: i.unique, modifiers: i.modifiers }))
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
