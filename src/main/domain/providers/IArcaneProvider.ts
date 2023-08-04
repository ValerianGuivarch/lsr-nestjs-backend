import { Arcane } from '../models/arcanes/Arcane'
import { OwnedArcane } from '../models/arcanes/OwnedArcane'

export interface IArcaneProvider {
  findAllArcane(): Promise<Arcane[]>
  findOneArcaneByName(name: string): Promise<Arcane>
  findOwnedArcaneById(id: number): Promise<OwnedArcane>
  findOwnedArcaneByCharacter(name: string): Promise<OwnedArcane[]>
}
