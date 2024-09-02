import { Stat } from '../entities/stat.entity'
import { IStatProvider } from '../providers/stat.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class StatService {
  constructor(@Inject('IStatProvider') private statProvider: IStatProvider) {}

  async getAll(): Promise<Stat[]> {
    return await this.statProvider.findAll()
  }
}
