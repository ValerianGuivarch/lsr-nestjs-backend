import { Jdr } from '../../../domain/jdr/Jdr'
import { StatDto } from '../../stats/dto/StatDto'
import { TraitDto } from '../../traits/dto/TraitDto'
import { ResourceDto } from '../../resources/dto/ResourceDto'
import { ItemDto, OwnedItemDto } from '../../items/dto/ItemDto'
import { CharacterDto } from '../../characters/dto/CharacterDto'
import { JdrClassDto } from '../../classes/dto/ClassDto'
import { JdrGroupDto } from '../../groups/dto/GroupDto'
import { PlayerDto } from '../../players/dto/PlayerDto'

export class JdrDto {
  slug: string
  name: string
  text: string
  stats: StatDto[]
  traits: TraitDto[]
  resources: ResourceDto[]
  items: ItemDto[]
  groupItems: OwnedItemDto[]
  characters: CharacterDto[]
  players: PlayerDto[]
  classes: JdrClassDto[]
  groups: JdrGroupDto[]

  static from(jdr: Jdr): JdrDto {
    const dto = new JdrDto()
    dto.slug = jdr.slug
    dto.name = jdr.name
    dto.text = jdr.text.value
    dto.stats = jdr.stats.map((s) => ({ slug: s.slug, name: s.name }))
    dto.traits = jdr.traits.map((t) => TraitDto.from(t))
    dto.resources = jdr.resources.map((r) => ({
      slug: r.slug,
      name: r.name,
      ownerType: r.ownerType,
      defaultValue: r.defaultValue
    }))
    dto.items = jdr.items.map((i) => ({
      slug: i.slug,
      name: i.name,
      description: i.description,
      unique: i.unique,
      modifiers: i.modifiers
    }))
    dto.groupItems = jdr.groupItems.map((gi) => ({ itemSlug: gi.itemSlug, quantity: gi.quantity }))
    dto.characters = jdr.characters.map((c) => CharacterDto.from(c, jdr))
    dto.players = jdr.players.map((p) => ({ slug: p.slug, name: p.name }))
    dto.classes = jdr.classes.map((c) => ({
      slug: c.slug,
      name: c.name,
      text: c.text,
      levels: c.levels
    }))
    dto.groups = jdr.groups.map((g) => ({
      slug: g.slug,
      name: g.name,
      text: g.text,
      resources: g.resources.map((r) => ({ resourceSlug: r.resourceSlug, name: r.name, value: r.value }))
    }))
    return dto
  }
}

export class JdrSummaryDto {
  slug: string
  name: string
}
