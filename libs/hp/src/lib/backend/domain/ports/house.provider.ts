import { House } from '../entities/house.entity'

export interface IHouseProvider {
  findAll(): Promise<House[]>
  updatePoints(houseName: string, points: number): Promise<void>
}
