import { Flip, FlipToCreate } from '../entities/flip.entity'

export interface IFlipProvider {
  create(flip: FlipToCreate): Promise<Flip>
  findAll(): Promise<Flip[]>
  findById(flipId: string): Promise<Flip>
  update(
    id: string,
    update: {
      xpOk: boolean
    }
  ): Promise<void>
}
