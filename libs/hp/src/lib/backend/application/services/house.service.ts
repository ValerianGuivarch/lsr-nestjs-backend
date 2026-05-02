import { House } from '../../domain/entities/house.entity'
import { IHouseProvider } from '../../domain/ports/house.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class HouseService {
  constructor(@Inject('IHouseProvider') private houseProvider: IHouseProvider) {}

  async getAll(): Promise<House[]> {
    return await this.houseProvider.findAll()
  }

  async updatePoints(houseName: string, points: number): Promise<House> {
    await this.houseProvider.updatePoints(houseName, points)
    const house = (await this.houseProvider.findAll()).find((currentHouse) => currentHouse.name === houseName)
    if (!house) {
      throw new Error(`House not found after update: ${houseName}`)
    }
    return house
  }

  async updateManyPoints(pointsByHouse: { houseName: string; points: number }[]): Promise<House[]> {
    for (const house of pointsByHouse) {
      await this.houseProvider.updatePoints(house.houseName, house.points)
    }
    return await this.houseProvider.findAll()
  }
}
