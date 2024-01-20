import { Constellation, ConstellationToCreate } from '../../models/elena/Constellation'

export interface IConstellationProvider {
  create(constellation: ConstellationToCreate): Promise<Constellation>
  findOneById(id: string): Promise<Constellation>
  update(p: { constellationId: string; constellation: Partial<Constellation> }): Promise<Constellation>
  findAll(): Promise<Constellation[]>
}
