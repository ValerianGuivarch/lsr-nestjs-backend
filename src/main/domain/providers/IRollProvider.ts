import { Roll, RollToCreate } from '../models/roll/Roll'

export interface IRollProvider {
  add(roll: RollToCreate): Promise<Roll>
  // update(roll: Roll): Promise<Roll>
  getLast(size: number): Promise<Roll[]>
  deleteAll(): Promise<boolean>
  delete(id: string): Promise<boolean>
}
