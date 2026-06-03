import { Inject, Injectable } from '@nestjs/common'
import { DiceRoll, Jdr } from '../../../../domain/src/index'
import { IJdrProvider } from '../domain/ports/jdr.provider'
import { DraftDto } from '../infrastructure/http/jdr.dto'

@Injectable()
export class JdrService {
  constructor(@Inject('IJdrProvider') private readonly jdrProvider: IJdrProvider) {}

  findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]> {
    return this.jdrProvider.findAll()
  }

  findOneBySlug(jdrSlug: string): Promise<Jdr> {
    return this.jdrProvider.findOneBySlug(jdrSlug)
  }

  create(p: { name: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.create(p)
  }

  update(jdrSlug: string, p: { name?: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.update(jdrSlug, p)
  }

  delete(jdrSlug: string): Promise<void> {
    return this.jdrProvider.delete(jdrSlug)
  }

  addStat(jdrSlug: string, p: { name: string }): Promise<Jdr> {
    return this.jdrProvider.addStat(jdrSlug, p)
  }

  updateStat(jdrSlug: string, statSlug: string, p: { name: string }): Promise<Jdr> {
    return this.jdrProvider.updateStat(jdrSlug, statSlug, p)
  }

  removeStat(jdrSlug: string, statSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeStat(jdrSlug, statSlug)
  }

  addTrait(jdrSlug: string, p: { name: string; type: string; level?: number; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
    return this.jdrProvider.addTrait(jdrSlug, p)
  }

  updateTrait(jdrSlug: string, traitSlug: string, p: { name?: string; type?: string; level?: number | null; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
    return this.jdrProvider.updateTrait(jdrSlug, traitSlug, p)
  }

  removeTrait(jdrSlug: string, traitSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeTrait(jdrSlug, traitSlug)
  }

  addResource(jdrSlug: string, p: { name: string; type: string }): Promise<Jdr> {
    return this.jdrProvider.addResource(jdrSlug, p)
  }

  updateResource(jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }): Promise<Jdr> {
    return this.jdrProvider.updateResource(jdrSlug, resourceSlug, p)
  }

  removeResource(jdrSlug: string, resourceSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeResource(jdrSlug, resourceSlug)
  }

  updateGroupResource(jdrSlug: string, resourceSlug: string, value: number): Promise<Jdr> {
    return this.jdrProvider.updateGroupResource(jdrSlug, resourceSlug, value)
  }

  addClass(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<Jdr> {
    return this.jdrProvider.addClass(jdrSlug, p)
  }

  updateClass(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<Jdr> {
    return this.jdrProvider.updateClass(jdrSlug, classSlug, p)
  }

  removeClass(jdrSlug: string, classSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeClass(jdrSlug, classSlug)
  }

  addClassResource(jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }): Promise<Jdr> {
    return this.jdrProvider.addClassResource(jdrSlug, classSlug, p)
  }

  removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeClassResource(jdrSlug, classSlug, resourceSlug)
  }

  addGroup(jdrSlug: string, p: { name: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.addGroup(jdrSlug, p)
  }

  updateGroup(jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.updateGroup(jdrSlug, groupSlug, p)
  }

  removeGroup(jdrSlug: string, groupSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeGroup(jdrSlug, groupSlug)
  }

  addItem(jdrSlug: string, p: { name: string; description?: string; unique?: boolean; traitSlug?: string }): Promise<Jdr> {
    return this.jdrProvider.addItem(jdrSlug, p)
  }

  updateItem(jdrSlug: string, itemSlug: string, p: { name?: string; description?: string; unique?: boolean }): Promise<Jdr> {
    return this.jdrProvider.updateItem(jdrSlug, itemSlug, p)
  }

  removeItem(jdrSlug: string, itemSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeItem(jdrSlug, itemSlug)
  }

  addGroupItem(jdrSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr> {
    return this.jdrProvider.addGroupItem(jdrSlug, p)
  }

  removeGroupItem(jdrSlug: string, itemSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeGroupItem(jdrSlug, itemSlug)
  }

  addCharacter(jdrSlug: string, p: { name: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Jdr> {
    return this.jdrProvider.addCharacter(jdrSlug, p)
  }

  updateCharacter(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }): Promise<Jdr> {
    return this.jdrProvider.updateCharacter(jdrSlug, characterSlug, p)
  }

  removeCharacter(jdrSlug: string, characterSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacter(jdrSlug, characterSlug)
  }

  addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Jdr> {
    return this.jdrProvider.addCharacterGroup(jdrSlug, characterSlug, groupSlug)
  }

  removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacterGroup(jdrSlug, characterSlug, groupSlug)
  }

  addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr> {
    return this.jdrProvider.addCharacterTrait(jdrSlug, characterSlug, traitSlug)
  }

  removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacterTrait(jdrSlug, characterSlug, traitSlug)
  }

  addCharacterItem(jdrSlug: string, characterSlug: string, p: { itemSlug: string; quantity?: number }): Promise<Jdr> {
    return this.jdrProvider.addCharacterItem(jdrSlug, characterSlug, p)
  }

  removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacterItem(jdrSlug, characterSlug, itemSlug)
  }

  updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Jdr> {
    return this.jdrProvider.updateCharacterStat(jdrSlug, characterSlug, statSlug, value)
  }

  updateCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string, value: number): Promise<Jdr> {
    return this.jdrProvider.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, value)
  }

  removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacterResource(jdrSlug, characterSlug, resourceSlug)
  }

  rollDice(jdrSlug: string, characterSlug: string, statSlug: string, rollState?: DiceRoll['rollState'], text?: string | null): Promise<DiceRoll> {
    return this.jdrProvider.rollDice(jdrSlug, characterSlug, statSlug, rollState, text)
  }

  rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRoll> {
    return this.jdrProvider.rollArbitrary(jdrSlug, characterSlug, formula)
  }

  getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]> {
    return this.jdrProvider.getLastRolls(jdrSlug, size)
  }

  createDraft(jdrSlug: string, p: { name: string; groupSlug: string; traitType?: string; traitSlugs?: string[]; rounds: number }): Promise<DraftDto> {
    return this.jdrProvider.createDraft(jdrSlug, p)
  }

  getDrafts(jdrSlug: string): Promise<DraftDto[]> {
    return this.jdrProvider.getDrafts(jdrSlug)
  }

  updateDraft(jdrSlug: string, draftId: string, p: { name?: string; groupSlug?: string; traitType?: string; traitSlugs?: string[]; rounds?: number }): Promise<DraftDto> {
    return this.jdrProvider.updateDraft(jdrSlug, draftId, p)
  }

  launchDraft(jdrSlug: string, draftId: string): Promise<DraftDto> {
    return this.jdrProvider.launchDraft(jdrSlug, draftId)
  }

  getActiveDraft(jdrSlug: string): Promise<DraftDto | null> {
    return this.jdrProvider.getActiveDraft(jdrSlug)
  }

  pickDraft(jdrSlug: string, p: { characterSlug: string; traitSlug: string }): Promise<DraftDto> {
    return this.jdrProvider.pickDraft(jdrSlug, p)
  }

  passDraft(jdrSlug: string, p: { characterSlug: string }): Promise<DraftDto> {
    return this.jdrProvider.passDraft(jdrSlug, p)
  }

  closeDraft(jdrSlug: string): Promise<void> {
    return this.jdrProvider.closeDraft(jdrSlug)
  }

  deleteDraft(jdrSlug: string, draftId: string): Promise<void> {
    return this.jdrProvider.deleteDraft(jdrSlug, draftId)
  }
}
