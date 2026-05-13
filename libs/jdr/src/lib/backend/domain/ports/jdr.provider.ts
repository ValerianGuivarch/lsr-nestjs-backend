import { DiceRoll, Jdr } from '../../../../../domain/src/index'
import { DraftDto } from '../../infrastructure/http/jdr.dto'

export interface IJdrProvider {
  findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]>
  findOneBySlug(jdrSlug: string): Promise<Jdr>
  create(p: { name: string; text?: string }): Promise<Jdr>
  update(jdrSlug: string, p: { name?: string; text?: string }): Promise<Jdr>

  addStat(jdrSlug: string, p: { name: string }): Promise<Jdr>
  removeStat(jdrSlug: string, statSlug: string): Promise<Jdr>

  addTrait(jdrSlug: string, p: { name: string; type: string; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr>
  removeTrait(jdrSlug: string, traitSlug: string): Promise<Jdr>

  addResource(jdrSlug: string, p: { name: string; type: string }): Promise<Jdr>
  removeResource(jdrSlug: string, resourceSlug: string): Promise<Jdr>
  updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<Jdr>

  addClass(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<Jdr>
  removeClass(jdrSlug: string, classSlug: string): Promise<Jdr>
  addClassResource(jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }): Promise<Jdr>
  removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<Jdr>
  addGroup(jdrSlug: string, p: { name: string; text?: string }): Promise<Jdr>
  removeGroup(jdrSlug: string, groupSlug: string): Promise<Jdr>

  addItem(jdrSlug: string, p: { name: string; description?: string; unique?: boolean; traitSlug?: string }): Promise<Jdr>
  removeItem(jdrSlug: string, itemSlug: string): Promise<Jdr>
  addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr>
  removeGroupItem(jdrSlug: string, itemSlug: string): Promise<Jdr>

  delete(jdrSlug: string): Promise<void>

  addCharacter(jdrSlug: string, p: { name: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr>
  updateCharacter(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr>
  removeCharacter(jdrSlug: string, characterSlug: string): Promise<Jdr>
  addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr>
  removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr>
  addCharacterItem(jdrSlug: string, characterSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr>
  removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<Jdr>
  updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Jdr>
  updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<Jdr>

  rollDice(jdrSlug: string, characterSlug: string, statSlug: string): Promise<DiceRoll>
  getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]>

  createDraft(jdrSlug: string, p: { name: string; groupSlug: string; traitType?: string; traitSlugs?: string[]; rounds: number }): Promise<DraftDto>
  getDrafts(jdrSlug: string): Promise<DraftDto[]>
  updateDraft(jdrSlug: string, draftId: string, p: { name?: string; groupSlug?: string; traitType?: string; traitSlugs?: string[]; rounds?: number }): Promise<DraftDto>
  launchDraft(jdrSlug: string, draftId: string): Promise<DraftDto>
  getActiveDraft(jdrSlug: string): Promise<DraftDto | null>
  pickDraft(jdrSlug: string, p: { characterSlug: string; traitSlug: string }): Promise<DraftDto>
  passDraft(jdrSlug: string, p: { characterSlug: string }): Promise<DraftDto>
  closeDraft(jdrSlug: string): Promise<void>
  deleteDraft(jdrSlug: string, draftId: string): Promise<void>
}
