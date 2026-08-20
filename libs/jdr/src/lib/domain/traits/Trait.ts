import { StatModifier } from '../stats/StatModifier'
import { TraitType } from './TraitType'

export interface Trait {
  jdrSlug: string
  name: string
  slug: string
  type: TraitType
  level: number | null
  data: Record<string, unknown> | null
  modifiers: StatModifier[]
}
