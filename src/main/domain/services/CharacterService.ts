import { Category } from '../models/characters/Category'
import { Character } from '../models/characters/Character'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class CharacterService {
  private readonly logger = new Logger(CharacterService.name)
  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider
  ) {
    console.log('AuthenticationService')
  }

  async findOneByName(name: string): Promise<Character> {
    return this.characterProvider.findOneByName(name)
  }

  async findByName(name: string): Promise<Character | undefined> {
    return this.characterProvider.findByName(name)
  }

  async findManyByName(names: string[]): Promise<Character[]> {
    return this.characterProvider.findManyByName(names)
  }

  async findAll(playerName?: string): Promise<Character[]> {
    if (playerName === 'MJ') {
      return this.characterProvider.findAll()
    } else if (playerName) {
      return this.characterProvider.findAll(playerName)
    } else {
      return this.characterProvider.findAll('-no-player-')
    }
  }

  async findAllByCategory(category: Category): Promise<string[]> {
    return this.characterProvider.findAllByCategory(category)
  }

  async createOrUpdateCharacter(p: { character: Character }): Promise<Character> {
    return await this.characterProvider.createOrUpdate(p.character)
  }

  async deleteCharacter(p: { name: string }): Promise<boolean> {
    return await this.characterProvider.delete(p.name)
  }
}
