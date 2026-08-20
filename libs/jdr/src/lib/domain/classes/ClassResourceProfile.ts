import { Slug } from '../shared/Slug'

export type ClassResourceBehavior = 'fixed' | 'scalable'

export class ClassResourceProfile {
  jdrSlug: string
  classSlug: string
  resourceSlug: string
  resourceType: string
  defaultValue: number
  behavior: ClassResourceBehavior

  constructor(p: {
    jdrSlug: string
    classSlug: string
    resourceSlug: string
    resourceType: string
    defaultValue?: number
    behavior?: ClassResourceBehavior
  }) {
    this.jdrSlug = p.jdrSlug
    this.classSlug = p.classSlug
    this.resourceSlug = p.resourceSlug
    this.resourceType = p.resourceType
    this.defaultValue = p.defaultValue ?? 0
    this.behavior = p.behavior ?? 'fixed'

    Slug.assertValid(this.jdrSlug)
    Slug.assertValid(this.classSlug)
    Slug.assertValid(this.resourceSlug)
  }
}
