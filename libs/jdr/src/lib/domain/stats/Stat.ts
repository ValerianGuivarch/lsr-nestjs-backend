import { Slug } from '../shared/Slug'

export class Stat {
  jdrSlug: string
  name: string
  slug: string

  constructor(p: { jdrSlug: string; name: string; slug?: string }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}