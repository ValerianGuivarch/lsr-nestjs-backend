import { Inject, Injectable } from '@nestjs/common'
import { Character } from './Character'
import { ICharacterProvider } from './ports/ICharacterProvider'

@Injectable()
export class CharacterService {
  constructor(@Inject('ICharacterProvider') private readonly characterProvider: ICharacterProvider) {}

  add(jdrSlug: string, p: Parameters<ICharacterProvider['add']>[1]): Promise<Character> {
    return this.characterProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, characterSlug: string, p: Parameters<ICharacterProvider['update']>[2]): Promise<Character> {
    return this.characterProvider.update(jdrSlug, characterSlug, p)
  }

  remove(jdrSlug: string, characterSlug: string): Promise<void> {
    return this.characterProvider.remove(jdrSlug, characterSlug)
  }

  addCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<Character> {
    return this.characterProvider.addCharacterGroup(jdrSlug, characterSlug, groupSlug)
  }

  removeCharacterGroup(jdrSlug: string, characterSlug: string, groupSlug: string): Promise<void> {
    return this.characterProvider.removeCharacterGroup(jdrSlug, characterSlug, groupSlug)
  }

  addCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<Character> {
    return this.characterProvider.addCharacterTrait(jdrSlug, characterSlug, traitSlug)
  }

  removeCharacterTrait(jdrSlug: string, characterSlug: string, traitSlug: string): Promise<void> {
    return this.characterProvider.removeCharacterTrait(jdrSlug, characterSlug, traitSlug)
  }

  addCharacterItem(
    jdrSlug: string,
    characterSlug: string,
    p: { itemSlug: string; quantity?: number }
  ): Promise<Character> {
    return this.characterProvider.addCharacterItem(jdrSlug, characterSlug, p)
  }

  removeCharacterItem(jdrSlug: string, characterSlug: string, itemSlug: string): Promise<void> {
    return this.characterProvider.removeCharacterItem(jdrSlug, characterSlug, itemSlug)
  }

  updateCharacterStat(jdrSlug: string, characterSlug: string, statSlug: string, value: number): Promise<Character> {
    return this.characterProvider.updateCharacterStat(jdrSlug, characterSlug, statSlug, value)
  }

  updateCharacterResource(
    jdrSlug: string,
    characterSlug: string,
    resourceSlug: string,
    value: number
  ): Promise<Character> {
    return this.characterProvider.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, value)
  }

  addCharacterResource(
    jdrSlug: string,
    characterSlug: string,
    p: { name: string; value?: number }
  ): Promise<Character> {
    return this.characterProvider.addCharacterResource(jdrSlug, characterSlug, p)
  }

  removeCharacterResource(jdrSlug: string, characterSlug: string, resourceSlug: string): Promise<void> {
    return this.characterProvider.removeCharacterResource(jdrSlug, characterSlug, resourceSlug)
  }
}
