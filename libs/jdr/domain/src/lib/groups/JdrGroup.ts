import { Slug } from '../shared/Slug'

export class JdrGroup {
  jdrSlug: string
  name: string
  slug: string
  text: string

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    text?: string
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.text = p.text ?? ''

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}
