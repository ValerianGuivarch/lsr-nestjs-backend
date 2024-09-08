import { DBHouse } from './house.db'
import { House } from '../domain/entities/house.entity'
import { IHouseProvider } from '../domain/providers/house.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class HouseImplementation implements IHouseProvider {
  constructor(
    @InjectRepository(DBHouse, 'postgres')
    private readonly houseRepository: Repository<DBHouse>
  ) {}

  async findAll(): Promise<House[]> {
    return (
      await this.houseRepository.find({
        relations: DBHouse.RELATIONS
      })
    ).map(DBHouse.toHouse)
  }
}
