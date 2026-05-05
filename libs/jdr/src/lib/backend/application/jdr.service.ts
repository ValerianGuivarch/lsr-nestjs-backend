import { Inject, Injectable } from '@nestjs/common'
import { DiceRoll, Jdr } from '../../../../domain/src/index'
import { IJdrProvider } from '../domain/ports/jdr.provider'

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

  removeStat(jdrSlug: string, statSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeStat(jdrSlug, statSlug)
  }

  addTrait(jdrSlug: string, p: { name: string; type: string; modifiers?: { statSlug: string; value: number }[] }): Promise<Jdr> {
    return this.jdrProvider.addTrait(jdrSlug, p)
  }

  removeTrait(jdrSlug: string, traitSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeTrait(jdrSlug, traitSlug)
  }

  addResource(jdrSlug: string, p: { name: string; type: string }): Promise<Jdr> {
    return this.jdrProvider.addResource(jdrSlug, p)
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

  removeGroup(jdrSlug: string, groupSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeGroup(jdrSlug, groupSlug)
  }

  addItem(jdrSlug: string, p: { name: string; description?: string; unique?: boolean; traitSlug?: string }): Promise<Jdr> {
    return this.jdrProvider.addItem(jdrSlug, p)
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

  addCharacter(jdrSlug: string, p: { name: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.addCharacter(jdrSlug, p)
  }

  updateCharacter(jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; groupSlug?: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.updateCharacter(jdrSlug, characterSlug, p)
  }

  removeCharacter(jdrSlug: string, characterSlug: string): Promise<Jdr> {
    return this.jdrProvider.removeCharacter(jdrSlug, characterSlug)
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

  rollDice(jdrSlug: string, characterSlug: string, statSlug: string): Promise<DiceRoll> {
    return this.jdrProvider.rollDice(jdrSlug, characterSlug, statSlug)
  }

  getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]> {
    return this.jdrProvider.getLastRolls(jdrSlug, size)
  }
}
