import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { Character, CharacterToCreate } from '../models/characters/Character'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'

export class CharacterService {
  private readonly logger = new Logger(CharacterService.name)

  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider
  ) {
    console.log('CharacterService')
  }

  async findOneByName(name: string): Promise<Character> {
    return this.characterProvider.findOneByName(name)
  }
  async findAllControllerBy(name: string): Promise<Character[]> {
    return this.characterProvider.findAllControlledBy(name)
  }

  async createCharacter(p: { character: CharacterToCreate }): Promise<Character> {
    return await this.characterProvider.create(p.character)
  }

  async updateCharacter(p: { character: Character }): Promise<Character> {
    if (p.character.apotheoseName && p.character.apotheoseState == ApotheoseState.NONE) {
      p.character.apotheoseState = ApotheoseState.COST_PAID
    }
    if (
      !p.character.apotheoseName &&
      (p.character.apotheoseState == ApotheoseState.COST_PAID ||
        p.character.apotheoseState == ApotheoseState.COST_TO_PAY)
    ) {
      p.character.apotheoseState = ApotheoseState.ALREADY_USED
    }
    if (p.character.apotheoseName && p.character.apotheoseState == ApotheoseState.ALREADY_USED) {
      p.character.apotheoseState = ApotheoseState.COST_TO_PAY
    }
    return await this.characterProvider.update(p.character)
  }

  getCharacterObservable(name: string): Observable<Character> {
    return this.characterProvider.getCharacterObservable(name)
  }
  getCharactersSessionObservable(): Observable<Character[]> {
    return this.characterProvider.getCharactersSessionObservable()
  }

  findAll(): Promise<Character[]> {
    return this.characterProvider.findAll()
  }

  getCharactersControlledObservable(name: string): Observable<Character[]> {
    return this.characterProvider.getCharactersControlledObservable(name)
  }

  async deleteControlledCharacter(controllerName: string, characterToDeleteName: string): Promise<void> {
    const characterToDelete = await this.characterProvider.findOneByName(characterToDeleteName)
    if (characterToDelete.isInvocation) {
      await this.characterProvider.delete(characterToDeleteName)
    } else {
      await this.characterProvider.update({
        ...characterToDelete,
        controlledBy: null
      })
    }
  }
}
