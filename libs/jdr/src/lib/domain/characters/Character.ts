import { OwnedItem } from '../items/OwnedItem'
import { CharacterResource } from '../resources/CharacterResource'
import { Slug } from '../shared/Slug'
import { CharacterStat } from '../stats/CharacterStat'

export class Character {
  jdrSlug: string
  name: string
  slug: string
  playerSlug?: string
  classSlug?: string
  groupSlugs: string[]
  classLevel?: string
  isPlayable: boolean
  // Whether the character shows up in the public JdR/character selection list; hidden ones still work via a direct link.
  public: boolean
  text: string
  stats: CharacterStat[]
  traitSlugs: string[]
  items: OwnedItem[]
  resources: CharacterResource[]

  constructor(p: {
    jdrSlug: string
    name: string
    slug?: string
    playerSlug?: string
    classSlug?: string
    groupSlugs?: string[]
    classLevel?: string
    isPlayable?: boolean
    public?: boolean
    text?: string
    stats: CharacterStat[]
    traitSlugs?: string[]
    items?: OwnedItem[]
    resources?: CharacterResource[]
  }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.playerSlug = p.playerSlug
    this.classSlug = p.classSlug
    this.groupSlugs = p.groupSlugs ?? []
    this.classLevel = p.classLevel
    this.isPlayable = p.isPlayable ?? false
    this.public = p.public ?? true
    this.text = p.text ?? ''
    this.stats = p.stats
    this.traitSlugs = p.traitSlugs ?? []
    this.items = p.items ?? []
    this.resources = p.resources ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
    if (this.playerSlug) Slug.assertValid(this.playerSlug)
    if (this.classSlug) Slug.assertValid(this.classSlug)
    this.groupSlugs.forEach((gs) => Slug.assertValid(gs))
    this.traitSlugs.forEach((traitSlug) => Slug.assertValid(traitSlug))
  }
}
