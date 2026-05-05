export class DiceRoll {
  id: string
  jdrSlug: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  results: number[]
  createdDate: Date

  constructor(p: DiceRoll) {
    Object.assign(this, p)
  }
}
