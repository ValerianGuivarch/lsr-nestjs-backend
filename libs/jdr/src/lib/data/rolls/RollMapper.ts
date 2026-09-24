import { DiceRoll } from '../../domain/rolls/DiceRoll'
import { DBJdrDiceRoll } from './database/jdr-dice-roll.db'

export class RollMapper {
  static toDomain(db: DBJdrDiceRoll): DiceRoll {
    return new DiceRoll({
      id: db.id,
      jdrSlug: db.jdrSlug,
      characterSlug: db.characterSlug,
      characterName: db.characterName,
      statSlug: db.statSlug,
      statName: db.statName,
      statValue: db.statValue,
      rollState: db.rollState as DiceRoll['rollState'],
      isArbitrary: db.isArbitrary ?? false,
      formula: db.formula ?? null,
      results: db.results.map(Number),
      text: db.text ?? null,
      createdDate: db.createdDate
    })
  }
}
