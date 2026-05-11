import { Slug } from '../shared/Slug'

export class Item {
  jdrSlug: string
  name: string
  slug: string
  description: string
  traitSlug?: string
  unique: boolean

  constructor(p: { jdrSlug: string; name: string; slug?: string; description?: string; traitSlug?: string; unique?: boolean }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.description = p.description ?? ''
    this.traitSlug = p.traitSlug
    this.unique = p.unique ?? true

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
    if (this.traitSlug) {
      Slug.assertValid(this.traitSlug)
    }
  }
}