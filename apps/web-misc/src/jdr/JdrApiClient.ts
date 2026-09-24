const API_BASE = '/apil7r/jdr'

export type RollState = 'normal' | 'disadvantage' | 'advantage' | 'double_advantage'

export interface DiceRollDto {
  id: string
  jdrSlug: string
  characterSlug: string
  characterName: string
  statSlug: string
  statName: string
  statValue: number
  rollState: RollState
  isArbitrary: boolean
  formula: string | null
  results: number[]
  text: string | null
  createdDate: string
}

export interface CharacterStatDto {
  statSlug: string
  value: number
  finalValue: number
}

export interface CharacterDto {
  slug: string
  name: string
  playerSlug: string | null
  classSlug: string | null
  groupSlugs: string[]
  classLevel: string | null
  isPlayable: boolean
  public: boolean
  text: string
  stats: CharacterStatDto[]
  traitSlugs: string[]
  items: Array<{ itemSlug: string; quantity: number }>
  resources: Array<{ resourceSlug: string; name: string; value: number }>
}

export interface ItemDto {
  slug: string
  name: string
  description: string
  unique: boolean
  modifiers: Array<{ statSlug: string; value: number }>
}

export interface TraitDto {
  slug: string
  name: string
  type: string
  level: number | null
  data: Record<string, unknown> | null
  modifiers: Array<{ statSlug: string; value: number }>
}

export interface StatDto {
  slug: string
  name: string
}

export interface ResourceDto {
  slug: string
  name: string
  ownerType: 'CHARACTER' | 'GROUP'
  defaultValue: number
}

export interface JdrClassDto {
  slug: string
  name: string
  text: string
  levels: string[]
}

export interface JdrGroupDto {
  slug: string
  name: string
  text: string
  resources: Array<{ resourceSlug: string; name: string; value: number }>
}

export interface JdrSummaryDto {
  slug: string
  name: string
}

export interface JdrDto {
  slug: string
  name: string
  text: string
  stats: StatDto[]
  traits: TraitDto[]
  resources: ResourceDto[]
  items: ItemDto[]
  groupItems: Array<{ itemSlug: string; quantity: number }>
  characters: CharacterDto[]
  players: Array<{ slug: string; name: string }>
  classes: JdrClassDto[]
  groups: JdrGroupDto[]
}

/** Read/play-time API used by the character sheet page. Catalog/admin CRUD lives in admin-jdr (React Admin). */
export class JdrApiClient {
  static async findAll(): Promise<JdrSummaryDto[]> {
    const res = await fetch(API_BASE)
    if (!res.ok) throw new Error(`Failed to fetch JdR list: ${res.statusText}`)
    return res.json()
  }

  static async findOneBySlug(jdrSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}`)
    if (!res.ok) throw new Error(`Failed to fetch JdR: ${res.statusText}`)
    return res.json()
  }

  static async getLastRolls(jdrSlug: string, size = 30): Promise<DiceRollDto[]> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/rolls?size=${size}`)
    if (!res.ok) throw new Error(`Failed to fetch rolls: ${res.statusText}`)
    return res.json()
  }

  static async rollDice(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    rollState: RollState = 'normal',
    text?: string | null
  ): Promise<DiceRollDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/roll/${statSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollState, text: text ?? undefined })
    })
    if (!res.ok) throw new Error(`Failed to roll dice: ${res.statusText}`)
    return res.json()
  }

  static async rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRollDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/roll-arbitrary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formula })
    })
    if (!res.ok) throw new Error(`Failed to roll arbitrary dice: ${res.statusText}`)
    return res.json()
  }

  static async updateCharacterResource(
    jdrSlug: string,
    characterSlug: string,
    resourceSlug: string,
    value: number
  ): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/resources/${resourceSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error(`Failed to update character resource: ${res.statusText}`)
    return res.json()
  }
}
