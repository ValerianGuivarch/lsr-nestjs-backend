import { Category } from '../models/characters/Category'
import { Character, CharacterToCreate } from '../models/characters/Character'

export interface ICharacterProvider {
  create(character: CharacterToCreate): Promise<Character>
  update(character: Character): Promise<Character>
  delete(name: string): Promise<boolean>
  findOneByName(name: string): Promise<Character>
  findByName(name: string): Promise<Character | undefined>
  exist(name: string): Promise<boolean>
  findManyByName(names: string[]): Promise<Character[]>
  findAll(category?: Category): Promise<Character[]>
  countAll(): Promise<number>
  findAllByCategory(category: Category): Promise<string[]>
}
