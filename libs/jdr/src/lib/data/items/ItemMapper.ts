import { Item } from '../../domain/items/Item'
import { OwnedItem } from '../../domain/items/OwnedItem'
import { StatModifier } from '../../domain/stats/StatModifier'
import { DBJdrItem } from './database/jdr-item.db'
import { DBJdrItemModifier } from './database/jdr-item-modifier.db'
import { DBJdrGroupItem } from './database/jdr-group-item.db'

export class ItemMapper {
  static toDomain(db: DBJdrItem): Item {
    return new Item({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      description: db.description,
      unique: db.unique,
      modifiers: (db.modifiers ?? []).map(ItemMapper.toModifier)
    })
  }

  static toModifier(db: DBJdrItemModifier): StatModifier {
    return new StatModifier({ statSlug: db.statSlug, value: db.value })
  }

  static toOwnedItem(db: DBJdrGroupItem): OwnedItem {
    return new OwnedItem({ itemSlug: db.itemSlug, quantity: db.quantity })
  }
}
