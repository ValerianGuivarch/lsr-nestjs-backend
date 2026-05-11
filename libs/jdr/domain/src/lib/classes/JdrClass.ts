import { Slug } from '../shared/Slug'
import { ClassResourceProfile } from './ClassResourceProfile'

export class JdrClass {
  jdrSlug: string
  name: string
  slug: string
  text: string
  level: number
  resources: ClassResourceProfile[]

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    text?: string
    level?: number
    resources?: ClassResourceProfile[]
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.text = p.text ?? ''
    this.level = p.level ?? 1
    this.resources = p.resources ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}
