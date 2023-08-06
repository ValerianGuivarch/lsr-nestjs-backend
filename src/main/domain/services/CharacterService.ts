import { Category } from '../models/characters/Category'
import { Character, CharacterToCreate } from '../models/characters/Character'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

export class CharacterService {
  private readonly logger = new Logger(CharacterService.name)

  private characters: Map<string, Subject<Character>> = new Map()

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
    const character = await this.characterProvider.create(p.character)
    const characterObservable = this.characters.get(character.name)
    if (characterObservable) {
      characterObservable.next(character)
    }
    return character
  }

  async updateCharacter(p: { character: Character }): Promise<Character> {
    const character = await this.characterProvider.update(p.character)
    const characterObservable = this.characters.get(character.name)
    if (characterObservable) {
      characterObservable.next(character)
    }
    return character
  }

  getCharacterObservable(name: string): Observable<Character> {
    if (!this.characters.has(name)) {
      this.characters.set(name, new Subject())
    }
    return this.characters.get(name).asObservable()
  }
}
