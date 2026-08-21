import { Character } from '../../domain/characters/Character'
import { CharacterStat } from '../../domain/stats/CharacterStat'
import { CharacterResource } from '../../domain/resources/CharacterResource'
import { OwnedItem } from '../../domain/items/OwnedItem'
import { DBJdrCharacter } from './database/jdr-character.db'
import { DBJdrCharacterStat } from './database/jdr-character-stat.db'
import { DBJdrCharacterItem } from './database/jdr-character-item.db'
import { DBJdrCharacterResource } from './database/jdr-character-resource.db'

export class CharacterMapper {
  static toDomain(db: DBJdrCharacter): Character {
    return new Character({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      classSlug: db.classSlug ?? undefined,
      groupSlugs: (db.groups ?? []).map((g) => g.groupSlug),
      classLevel: db.classLevel ?? 1,
      isPlayable: db.isPlayable ?? false,
      public: db.public ?? true,
      text: db.text,
      stats: (db.stats ?? []).map(CharacterMapper.toCharacterStat),
      traitSlugs: (db.traits ?? []).map((ct) => ct.traitSlug),
      items: (db.items ?? []).map(CharacterMapper.toOwnedItem),
      resources: (db.resources ?? []).map(CharacterMapper.toCharacterResource)
    })
  }

  static toCharacterStat(db: DBJdrCharacterStat): CharacterStat {
    return new CharacterStat({ statSlug: db.statSlug, value: db.value })
  }

  static toOwnedItem(db: DBJdrCharacterItem): OwnedItem {
    return new OwnedItem({ itemSlug: db.itemSlug, quantity: db.quantity })
  }

  static toCharacterResource(db: DBJdrCharacterResource): CharacterResource {
    return new CharacterResource({ resourceSlug: db.resourceSlug, value: db.value })
  }
}
