import { Slug } from '../shared/Slug'
import { TraitStatModifier } from '../stats/TraitStatModifier'
import { TraitType } from './TraitType'

export class Trait {
  jdrSlug: string
  name: string
  slug: string
  type: TraitType
  level: number | null
  data: Record<string, unknown> | null
  modifiers: TraitStatModifier[]

  constructor(p: { jdrSlug: string; name: string; slug?: string; type: TraitType; level?: number | null; data?: Record<string, unknown> | null; modifiers?: TraitStatModifier[] }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.type = p.type
    this.level = p.level ?? null
    this.data = p.data ?? null
    this.modifiers = p.modifiers ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}