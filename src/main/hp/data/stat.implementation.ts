import { DBStat } from './stat.db'
import { Stat } from '../domain/entities/stat.entity'
import { IStatProvider } from '../domain/providers/stat.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class StatImplementation implements IStatProvider {
  constructor(
    @InjectRepository(DBStat, 'postgres')
    private readonly statRepository: Repository<DBStat>
  ) {}

  async findAll(): Promise<Stat[]> {
    return (
      await this.statRepository.find({
        relations: DBStat.RELATIONS
      })
    ).map(DBStat.toStat)
  }
}
