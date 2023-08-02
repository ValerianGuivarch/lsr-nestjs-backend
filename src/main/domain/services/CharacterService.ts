import { Category } from '../models/characters/Category'
import { Character, CharacterToCreate } from '../models/characters/Character'
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
    console.log('CharacterService')
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

  async findAll(category?: Category): Promise<Character[]> {
    return this.characterProvider.findAll(category)
  }

  async findAllByCategory(category: Category): Promise<string[]> {
    return this.characterProvider.findAllByCategory(category)
  }

  async createCharacter(p: { character: CharacterToCreate }): Promise<Character> {
    return await this.characterProvider.create(p.character)
  }

  async updateCharacter(p: { character: Character }): Promise<Character> {
    return await this.characterProvider.update(p.character)
  }
}
