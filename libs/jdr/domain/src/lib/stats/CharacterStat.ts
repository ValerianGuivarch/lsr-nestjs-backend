import { assertFiniteNumber } from '../shared/Guards'
import { Slug } from '../shared/Slug'

export class CharacterStat {
  statSlug: string
  value: number

  constructor(p: { statSlug: string; value?: number }) {
    this.statSlug = p.statSlug
    this.value = p.value ?? 2
    Slug.assertValid(this.statSlug)
    assertFiniteNumber(this.value, 'CharacterStat.value')
  }
}