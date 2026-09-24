import { Slug } from '../shared/Slug'

export class JdrClass {
  jdrSlug: string
  name: string
  slug: string
  text: string
  levels: string[]

  constructor(p: { jdrSlug: string; name: string; slug?: string; text?: string; levels?: string[] }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.text = p.text ?? ''
    this.levels = p.levels ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
    if (new Set(this.levels).size !== this.levels.length) throw new Error(`Class levels must be unique`)
  }
}
