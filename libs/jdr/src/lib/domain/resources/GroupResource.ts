import { assertFiniteNumber } from '../shared/Guards'
import { Slug } from '../shared/Slug'

export class GroupResource {
  resourceSlug: string
  name: string
  value: number

  constructor(p: { resourceSlug: string; name: string; value: number }) {
    this.resourceSlug = p.resourceSlug
    this.name = p.name
    this.value = p.value

    Slug.assertValid(this.resourceSlug)
    assertFiniteNumber(this.value, 'GroupResource.value')
  }
}
