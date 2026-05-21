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
  classSlug: string | null
  groupSlugs: string[]
  classLevel: number
  isPlayable: boolean
  text: string
  stats: CharacterStatDto[]
  traitSlugs: string[]
  items: Array<{ itemSlug: string; quantity: number }>
  resources: Array<{ resourceSlug: string; value: number }>
}

export interface ItemDto {
  slug: string
  name: string
  description: string
  unique: boolean
  traitSlug: string | null
}

export interface TraitDto {
  slug: string
  name: string
  type: string
  modifiers: Array<{ statSlug: string; value: number }>
}

export interface StatDto {
  slug: string
  name: string
}

export interface ResourceDto {
  slug: string
  name: string
  type: string
}

export interface GroupResourceDto {
  resourceSlug: string
  value: number
}

export interface JdrClassResourceDto {
  resourceSlug: string
  resourceType: string
  defaultValue: number
  behavior: 'fixed' | 'scalable'
}

export interface JdrClassDto {
  slug: string
  name: string
  text: string
  level: number
  resources: JdrClassResourceDto[]
}

export interface JdrGroupDto {
  slug: string
  name: string
  text: string
}

export interface JdrDto {
  slug: string
  name: string
  text: string
  stats: StatDto[]
  traits: TraitDto[]
  resources: ResourceDto[]
  groupResources: GroupResourceDto[]
  items: ItemDto[]
  groupItems: Array<{ itemSlug: string; quantity: number }>
  characters: CharacterDto[]
  classes: JdrClassDto[]
  groups: JdrGroupDto[]
}

export interface DraftRoundDto {
  round: number
  availableTraitSlugs: string[]
  picks: Record<string, string>
}

export interface DraftDto {
  id: string
  name: string
  jdrSlug: string
  groupSlug: string
  traitType: string
  selectedTraitSlugs: string[]
  characterOrder: string[]
  currentHandsByCharacter: Record<string, string[]>
  totalRounds: number
  currentRound: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  rounds: DraftRoundDto[]
}

export class JdrApiClient {
  static async findAll(): Promise<Array<{ slug: string; name: string }>> {
    const res = await fetch(`${API_BASE}`)
    if (!res.ok) throw new Error(`Failed to fetch JdRs: ${res.statusText}`)
    return res.json()
  }

  static async findOneBySlug(jdrSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}`)
    if (!res.ok) throw new Error(`Failed to fetch JdR: ${res.statusText}`)
    return res.json()
  }

  static async getLastRolls(jdrSlug: string, size: number = 30): Promise<DiceRollDto[]> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/rolls?size=${size}`)
    if (!res.ok) throw new Error(`Failed to fetch rolls: ${res.statusText}`)
    return res.json()
  }

  static async rollDice(jdrSlug: string, characterSlug: string, statSlug: string, rollState: RollState = 'normal'): Promise<DiceRollDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/roll/${statSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollState })
    })
    if (!res.ok) throw new Error(`Failed to roll dice: ${res.statusText}`)
    return res.json()
  }

  static async createJdr(name: string, text?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text })
    })
    if (!res.ok) throw new Error(`Failed to create JdR: ${res.statusText}`)
    return res.json()
  }

  static async deleteJdr(jdrSlug: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${jdrSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to delete JdR: ${res.statusText}`)
  }

  static async updateJdr(jdrSlug: string, name?: string, text?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text })
    })
    if (!res.ok) throw new Error(`Failed to update JdR: ${res.statusText}`)
    return res.json()
  }

  static async addStat(jdrSlug: string, name: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error(`Failed to add stat: ${res.statusText}`)
    return res.json()
  }

  static async removeStat(jdrSlug: string, statSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/stats/${statSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove stat: ${res.statusText}`)
    return res.json()
  }

  static async addCharacter(jdrSlug: string, name: string, classSlug?: string, text?: string, isPlayable?: boolean, classLevel?: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, classSlug, text, isPlayable, classLevel })
    })
    if (!res.ok) throw new Error(`Failed to add character: ${res.statusText}`)
    return res.json()
  }

  static async updateCharacter(jdrSlug: string, characterSlug: string, name?: string, classSlug?: string, text?: string, isPlayable?: boolean, classLevel?: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, classSlug, text, isPlayable, classLevel })
    })
    if (!res.ok) throw new Error(`Failed to update character: ${res.statusText}`)
    return res.json()
  }

  static async removeCharacter(jdrSlug: string, characterSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove character: ${res.statusText}`)
    return res.json()
  }

  static async addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/groups/${groupSlug}`, { method: 'POST' })
    if (!res.ok) throw new Error(`Failed to add character group: ${res.statusText}`)
    return res.json()
  }

  static async removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/groups/${groupSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove character group: ${res.statusText}`)
    return res.json()
  }

  static async updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/stats/${statSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error(`Failed to update character stat: ${res.statusText}`)
    return res.json()
  }

  static async addTrait(jdrSlug: string, name: string, type: string, modifiers?: Array<{ statSlug: string; value: number }>): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/traits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, modifiers })
    })
    if (!res.ok) throw new Error(`Failed to add trait: ${res.statusText}`)
    return res.json()
  }

  static async removeTrait(jdrSlug: string, traitSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/traits/${traitSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove trait: ${res.statusText}`)
    return res.json()
  }

  static async updateTrait(jdrSlug: string, traitSlug: string, p: { name?: string; type?: string; modifiers?: Array<{ statSlug: string; value: number }> }): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/traits/${traitSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error(`Failed to update trait: ${res.statusText}`)
    return res.json()
  }

  static async addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/traits/${traitSlug}`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to add character trait: ${res.statusText}`)
    return res.json()
  }

  static async removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/traits/${traitSlug}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error(`Failed to remove character trait: ${res.statusText}`)
    return res.json()
  }

  static async addResource(jdrSlug: string, name: string, type: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    })
    if (!res.ok) throw new Error(`Failed to add resource: ${res.statusText}`)
    return res.json()
  }

  static async removeResource(jdrSlug: string, resourceSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/resources/${resourceSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove resource: ${res.statusText}`)
    return res.json()
  }

  static async updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/group-resources/${resourceSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error(`Failed to update group resource: ${res.statusText}`)
    return res.json()
  }

  static async addClass(jdrSlug: string, name: string, level: number, text?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, level, text })
    })
    if (!res.ok) throw new Error(`Failed to add class: ${res.statusText}`)
    return res.json()
  }

  static async removeClass(jdrSlug: string, classSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/classes/${classSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove class: ${res.statusText}`)
    return res.json()
  }

  static async addClassResource(jdrSlug: string, classSlug: string, resourceSlug: string, resourceType: string, defaultValue?: number, behavior?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/classes/${classSlug}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSlug, resourceType, defaultValue, behavior })
    })
    if (!res.ok) throw new Error(`Failed to add class resource: ${res.statusText}`)
    return res.json()
  }

  static async removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/classes/${classSlug}/resources/${resourceSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove class resource: ${res.statusText}`)
    return res.json()
  }

  static async addGroup(jdrSlug: string, name: string, text?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text })
    })
    if (!res.ok) throw new Error(`Failed to add group: ${res.statusText}`)
    return res.json()
  }

  static async removeGroup(jdrSlug: string, groupSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/groups/${groupSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove group: ${res.statusText}`)
    return res.json()
  }

  static async addItem(jdrSlug: string, name: string, description?: string, unique?: boolean, traitSlug?: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, unique, traitSlug })
    })
    if (!res.ok) throw new Error(`Failed to add item: ${res.statusText}`)
    return res.json()
  }

  static async removeItem(jdrSlug: string, itemSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/items/${itemSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove item: ${res.statusText}`)
    return res.json()
  }

  static async addGroupItem(jdrSlug: string, itemSlug: string, quantity?: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/group-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemSlug, quantity })
    })
    if (!res.ok) throw new Error(`Failed to add group item: ${res.statusText}`)
    return res.json()
  }

  static async removeGroupItem(jdrSlug: string, itemSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/group-items/${itemSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove group item: ${res.statusText}`)
    return res.json()
  }

  static async addCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string, quantity?: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemSlug, quantity })
    })
    if (!res.ok) throw new Error(`Failed to add character item: ${res.statusText}`)
    return res.json()
  }

  static async removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/items/${itemSlug}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error(`Failed to remove character item: ${res.statusText}`)
    return res.json()
  }

  static async updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/resources/${resourceSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error(`Failed to update character resource: ${res.statusText}`)
    return res.json()
  }

  static async removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/characters/${characterSlug}/resources/${resourceSlug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to remove character resource: ${res.statusText}`)
    return res.json()
  }

  static async createDraft(
    jdrSlug: string,
    groupSlug: string,
    rounds: number,
    options?: { name?: string; traitType?: string; traitSlugs?: string[] }
  ): Promise<DraftDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupSlug, rounds, ...options })
    })
    if (!res.ok) throw new Error(`Failed to create draft: ${res.statusText}`)
    return res.json()
  }

  static async getDrafts(jdrSlug: string): Promise<DraftDto[]> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/drafts`)
    if (!res.ok) throw new Error(`Failed to fetch drafts: ${res.statusText}`)
    return res.json()
  }

  static async updateDraft(
    jdrSlug: string,
    draftId: string,
    updates: { name?: string; groupSlug?: string; traitType?: string; traitSlugs?: string[]; rounds?: number }
  ): Promise<DraftDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/drafts/${draftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error(`Failed to update draft: ${res.statusText}`)
    return res.json()
  }

  static async launchDraft(jdrSlug: string, draftId: string): Promise<DraftDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/drafts/${draftId}/launch`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to launch draft: ${res.statusText}`)
    return res.json()
  }

  static async getActiveDraft(jdrSlug: string): Promise<DraftDto | null> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/draft`)
    if (!res.ok) throw new Error(`Failed to fetch active draft: ${res.statusText}`)
    return res.json()
  }

  static async pickDraft(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<DraftDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/draft/pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterSlug, traitSlug })
    })
    if (!res.ok) throw new Error(`Failed to pick draft card: ${res.statusText}`)
    return res.json()
  }

  static async passDraft(jdrSlug: string, characterSlug: string): Promise<DraftDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/draft/pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterSlug })
    })
    if (!res.ok) throw new Error(`Failed to pass draft card: ${res.statusText}`)
    return res.json()
  }

  static async closeDraft(jdrSlug: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/draft`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to close draft: ${res.statusText}`)
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

  static async updateStat(jdrSlug: string, statSlug: string, name: string): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/stats/${statSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error(`Failed to update stat: ${res.statusText}`)
    return res.json()
  }

  static async updateResource(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/resources/${resourceSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error(`Failed to update resource: ${res.statusText}`)
    return res.json()
  }

  static async updateClass(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/classes/${classSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error(`Failed to update class: ${res.statusText}`)
    return res.json()
  }

  static async updateGroup(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/groups/${groupSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error(`Failed to update group: ${res.statusText}`)
    return res.json()
  }

  static async updateItem(jdrSlug: string, itemSlug: string, p: { name?: string; description?: string; unique?: boolean }): Promise<JdrDto> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/items/${itemSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error(`Failed to update item: ${res.statusText}`)
    return res.json()
  }

  static async deleteDraft(jdrSlug: string, draftId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${jdrSlug}/drafts/${draftId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to delete draft: ${res.statusText}`)
  }
}
