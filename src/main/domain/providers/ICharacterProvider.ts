import { Character, CharacterToCreate } from '../models/characters/Character'
import { CharacterTemplate } from '../models/invocation/CharacterTemplate'
import { NatureLevel } from '../models/session/NatureLevel'
import { Observable } from 'rxjs'

export interface ICharacterProvider {
  getCharacterObservable(name: string): Observable<Character>
  getCharactersSessionObservable(): Observable<Character[]>
  getCharactersControlledObservable(name: string): Observable<Character[]>
  create(character: CharacterToCreate): Promise<Character>
  createInvocation(character: CharacterToCreate): Promise<Character>
  findAllControlledBy(characterName: string): Promise<Character[]>
  update(character: Character): Promise<Character>
  delete(name: string): Promise<boolean>
  findOneByName(name: string): Promise<Character>
  findTemplateByName(name: string): Promise<CharacterTemplate>
  findByName(name: string): Promise<Character | undefined>
  exist(name: string): Promise<boolean>
  findManyByName(names: string[]): Promise<Character[]>
  findAll(): Promise<Character[]>
  findAllForSession(): Promise<Character[]>
  countAll(): Promise<number>
  getNatureLevel(): Promise<NatureLevel>
}
