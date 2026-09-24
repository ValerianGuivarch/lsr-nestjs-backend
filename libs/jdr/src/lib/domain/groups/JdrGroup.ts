import { Slug } from '../shared/Slug'
import { GroupResource } from '../resources/GroupResource'

export class JdrGroup {
  jdrSlug: string
  name: string
  slug: string
  text: string
  resources: GroupResource[]

  constructor(p: { jdrSlug: string; name: string; slug?: string; text?: string; resources?: GroupResource[] }) {
    this.jdrSlug = p.jdrSlug
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.text = p.text ?? ''
    this.resources = p.resources ?? []

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.slug)
  }
}
