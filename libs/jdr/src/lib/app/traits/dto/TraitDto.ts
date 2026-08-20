import { Trait } from '../../../domain/traits/Trait'
import { TraitType } from '../../../domain/traits/TraitType'

export class TraitModifierDto {
  statSlug: string
  value: number
}

export class TraitDto implements Trait {
  jdrSlug: string
  name: string
  slug: string
  type: TraitType
  level: number | null
  data: Record<string, unknown> | null
  modifiers: TraitModifierDto[]

  static from(trait: Trait): TraitDto {
    const dto = new TraitDto()
    dto.jdrSlug = trait.jdrSlug
    dto.name = trait.name
    dto.slug = trait.slug
    dto.type = trait.type
    dto.level = trait.level
    dto.data = trait.data
    dto.modifiers = trait.modifiers.map((m) => ({ statSlug: m.statSlug, value: m.value }))
    return dto
  }
}
