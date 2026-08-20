import { Character } from '../Character'

export interface ICharacterProvider {
  add(jdrSlug: string, p: { name: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Character>
  update(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Character>
  remove(jdrSlug: string, characterSlug: string): Promise<void>
  addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Character>
  removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<void>
  addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Character>
  removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<void>
  addCharacterItem(jdrSlug: string, characterSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Character>
  removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<void>
  updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Character>
  updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<Character>
  removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<void>
}
