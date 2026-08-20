import { StatModifier } from '../../domain/stats/StatModifier'
import { Trait } from '../../domain/traits/Trait'
import { DBJdrTrait } from './database/DBJdrTrait'
import { DBJdrTraitModifier } from './database/DBJdrTraitModifier'

export class TraitMapper {
  static toDomain(db: DBJdrTrait): Trait {
    return {
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      type: db.type,
      level: db.level ?? null,
      data: db.data ?? null,
      modifiers: (db.modifiers ?? []).map(TraitMapper.toDomainModifier)
    }
  }

  static toDomainModifier(db: DBJdrTraitModifier): StatModifier {
    return new StatModifier({ statSlug: db.statSlug, value: db.value })
  }
}
