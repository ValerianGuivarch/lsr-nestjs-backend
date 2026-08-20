export type RollState = 'normal' | 'disadvantage' | 'advantage' | 'double_advantage'

export class DiceRoll {
  id: string
  jdrSlug: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  rollState: RollState
  isArbitrary: boolean
  formula: string | null
  results: number[]
  text: string | null
  createdDate: Date

  constructor(p: DiceRoll) {
    Object.assign(this, p)
  }
}
