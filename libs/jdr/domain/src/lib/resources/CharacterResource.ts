import { assertFiniteNumber } from '../shared/Guards'
import { Slug } from '../shared/Slug'

export class CharacterResource {
  resourceSlug: string
  value: number

  constructor(p: { resourceSlug: string; value: number }) {
    this.resourceSlug = p.resourceSlug
    this.value = p.value

    Slug.assertValid(this.resourceSlug)
    assertFiniteNumber(this.value, 'CharacterResource.value')
  }
}