import { Character } from '../models/characters/Character'
import { Roll } from '../models/roll/Roll'

export interface IRollProvider {
  add(roll: Roll): Promise<Roll>
  // update(roll: Roll): Promise<Roll>
  getLast(size: number): Promise<Roll[]>
  getLastForCharacter(character: Character): Promise<Roll | undefined>
  helpUsed(rollList: Roll[]): Promise<boolean>
  availableHelp(characterName: string): Promise<Roll[]>
  deleteAll(): Promise<boolean>
  delete(id: string): Promise<boolean>
}
