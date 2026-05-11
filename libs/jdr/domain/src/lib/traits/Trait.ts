import { Slug } from '../shared/Slug'
import { TraitStatModifier } from '../stats/TraitStatModifier'
import { TraitType } from './TraitType'

export class Trait {
  jdrSlug: string
  name: string
  slug: string
  type: TraitType
  modifiers: TraitStatModifier[]

  constructor(p: { jdrSlug: string; name: string; slug?: string; type: TraitType; modifiers?: TraitStatModifier[] }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.type = p.type
    this.modifiers = p.modifiers ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}