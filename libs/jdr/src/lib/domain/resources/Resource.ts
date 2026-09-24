import { Slug } from '../shared/Slug'
import { assertFiniteNumber } from '../shared/Guards'
import { ResourceOwnerType } from './ResourceType'

export class Resource {
  jdrSlug: string
  name: string
  slug: string
  ownerType: ResourceOwnerType
  defaultValue: number

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    ownerType: ResourceOwnerType
    defaultValue?: number
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.ownerType = p.ownerType
    this.defaultValue = p.defaultValue ?? 0

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
    if (!Object.values(ResourceOwnerType).includes(this.ownerType))
      throw new Error(`Invalid resource owner type: ${this.ownerType}`)
    assertFiniteNumber(this.defaultValue, 'Resource.defaultValue')
  }
}
