// Mirrors the shapes returned/accepted by libs/jdr/src/lib/app/**/dto and Requests.

export interface JdrSummary {
  slug: string
  name: string
}

export interface StatModifier {
  statSlug: string
  value: number
}

export interface StatEntity {
  slug: string
  name: string
}

export interface TraitEntity {
  slug: string
  name: string
  type: string
  level: number | null
  data: Record<string, unknown> | null
  modifiers: StatModifier[]
}

export interface GameResourceEntity {
  slug: string
  name: string
  type: string
}

export interface GroupResourceEntity {
  resourceSlug: string
  value: number
}

export interface ItemEntity {
  slug: string
  name: string
  description: string
  unique: boolean
  modifiers: StatModifier[]
}

export interface GroupItemEntity {
  itemSlug: string
  quantity: number
}

export interface ClassResourceEntity {
  resourceSlug: string
  resourceType: string
  defaultValue: number
  behavior: 'fixed' | 'scalable'
}

export interface ClassEntity {
  slug: string
  name: string
  text: string
  level: number
  resources: ClassResourceEntity[]
}

export interface GroupEntity {
  slug: string
  name: string
  text: string
}

export interface CharacterStatEntity {
  statSlug: string
  value: number
  finalValue: number
}

export interface CharacterResourceEntity {
  resourceSlug: string
  value: number
}

export interface OwnedItemEntity {
  itemSlug: string
  quantity: number
}

export interface CharacterEntity {
  slug: string
  name: string
  classSlug: string | null
  groupSlugs: string[]
  classLevel: number
  isPlayable: boolean
  public: boolean
  text: string
  stats: CharacterStatEntity[]
  traitSlugs: string[]
  items: OwnedItemEntity[]
  resources: CharacterResourceEntity[]
}

export interface DiceRollEntity {
  id: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  rollState: string
  isArbitrary: boolean
  formula: string | null
  results: number[]
  text: string | null
  createdDate: string
}

export interface JdrAggregate {
  slug: string
  name: string
  text: string
  stats: StatEntity[]
  traits: TraitEntity[]
  resources: GameResourceEntity[]
  groupResources: GroupResourceEntity[]
  items: ItemEntity[]
  groupItems: GroupItemEntity[]
  characters: CharacterEntity[]
  classes: ClassEntity[]
  groups: GroupEntity[]
}
