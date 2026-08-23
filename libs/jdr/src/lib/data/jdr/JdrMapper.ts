import { Jdr } from '../../domain/jdr/Jdr'
import { StatMapper } from '../stats/StatMapper'
import { TraitMapper } from '../traits/TraitMapper'
import { ResourceMapper } from '../resources/ResourceMapper'
import { ItemMapper } from '../items/ItemMapper'
import { CharacterMapper } from '../characters/CharacterMapper'
import { ClassMapper } from '../classes/ClassMapper'
import { GroupMapper } from '../groups/GroupMapper'
import { DBJdr } from './database/DBJdr'
import { PlayerMapper } from '../players/PlayerMapper'

export class JdrMapper {
  static toDomain(db: DBJdr): Jdr {
    return new Jdr({
      name: db.name,
      slug: db.slug,
      text: db.text,
      stats: db.stats.map(StatMapper.toDomain),
      traits: db.traits.map(TraitMapper.toDomain),
      resources: db.resources.map(ResourceMapper.toDomain),
      items: db.items.map(ItemMapper.toDomain),
      groupItems: db.groupItems.map(ItemMapper.toOwnedItem),
      characters: (db.characters ?? []).map(CharacterMapper.toDomain),
      players: (db.players ?? []).map(PlayerMapper.toDomain),
      classes: (db.classes ?? []).map(ClassMapper.toDomain),
      groups: (db.groups ?? []).map(GroupMapper.toDomain)
    })
  }
}
