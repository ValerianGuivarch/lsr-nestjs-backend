import { Slug } from '../shared/Slug'
import { StatModifier } from '../stats/StatModifier'

export class Item {
  jdrSlug: string
  name: string
  slug: string
  description: string
  unique: boolean
  modifiers: StatModifier[]

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    description?: string
    unique?: boolean
    modifiers?: StatModifier[]
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.description = p.description ?? ''
    this.unique = p.unique ?? true
    this.modifiers = p.modifiers ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}
