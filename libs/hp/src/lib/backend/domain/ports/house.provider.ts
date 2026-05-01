import { House } from '../entities/house.entity'

export interface IHouseProvider {
  findAll(): Promise<House[]>
}
