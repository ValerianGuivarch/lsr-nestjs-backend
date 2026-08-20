import { Slug } from '../shared/Slug'
import { ResourceType } from './ResourceType'

export class Resource {
  jdrSlug: string
  name: string
  slug: string
  type: ResourceType

  constructor(p: { jdrSlug: string; name: string; slug?: string; type: ResourceType }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.type = p.type

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}