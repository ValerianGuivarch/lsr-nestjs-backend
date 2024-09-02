import { Flip, FlipToCreate } from '../entities/flip.entity'

export interface IFlipProvider {
  create(flip: FlipToCreate): Promise<Flip>
  findAll(): Promise<Flip[]>
}
