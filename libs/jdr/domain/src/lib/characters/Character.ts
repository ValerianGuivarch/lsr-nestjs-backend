import { OwnedItem } from '../items/OwnedItem'
import { CharacterResource } from '../resources/CharacterResource'
import { Slug } from '../shared/Slug'
import { CharacterStat } from '../stats/CharacterStat'

export class Character {
  jdrSlug: string
  name: string
  slug: string
  classSlug?: string
  groupSlug?: string
  text: string
  stats: CharacterStat[]
  traitSlugs: string[]
  items: OwnedItem[]
  resources: CharacterResource[]

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    classSlug?: string
    groupSlug?: string
    text?: string
    stats: CharacterStat[]
    traitSlugs?: string[]
    items?: OwnedItem[]
    resources?: CharacterResource[]
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.classSlug = p.classSlug
    this.groupSlug = p.groupSlug
    this.text = p.text ?? ''
    this.stats = p.stats
    this.traitSlugs = p.traitSlugs ?? []
    this.items = p.items ?? []
    this.resources = p.resources ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
    if (this.classSlug) Slug.assertValid(this.classSlug)
    if (this.groupSlug) Slug.assertValid(this.groupSlug)
    this.traitSlugs.forEach((traitSlug) => Slug.assertValid(traitSlug))
  }
}