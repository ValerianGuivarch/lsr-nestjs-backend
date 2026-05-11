import { assertFiniteNumber } from '../shared/Guards'
import { Slug } from '../shared/Slug'

export class TraitStatModifier {
  statSlug: string
  value: number

  constructor(p: { statSlug: string; value: number }) {
    this.statSlug = p.statSlug
    this.value = p.value
    Slug.assertValid(this.statSlug)
    assertFiniteNumber(this.value, 'TraitStatModifier.value')
  }
}