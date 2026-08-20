import { DiceRoll } from '../../../domain/rolls/DiceRoll'

export class DiceRollDto {
  id: string
  jdrSlug: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  rollState: DiceRoll['rollState']
  isArbitrary: boolean
  formula: string | null
  results: number[]
  text: string | null
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
    dto.rollState = roll.rollState
    dto.isArbitrary = roll.isArbitrary ?? false
    dto.formula = roll.formula ?? null
    dto.results = roll.results
    dto.text = roll.text ?? null
    dto.createdDate = roll.createdDate
    return dto
  }
}
