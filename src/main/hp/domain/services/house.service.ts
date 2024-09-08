import { House } from '../entities/house.entity'
import { IHouseProvider } from '../providers/house.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class HouseService {
  constructor(@Inject('IHouseProvider') private houseProvider: IHouseProvider) {}

  async getAll(): Promise<House[]> {
    return await this.houseProvider.findAll()
  }
}
