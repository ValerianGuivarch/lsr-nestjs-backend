import { DBBloodline } from './DBBloodline'
import { Bloodline } from '../../../domain/models/characters/Bloodline'
import { IBloodlineProvider } from '../../../domain/providers/IBloodlineProvider'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBBloodlineProvider implements IBloodlineProvider {
  constructor(
    @InjectRepository(DBBloodline, 'postgres')
    private dbBloodlineRepository: Repository<DBBloodline>
  ) {}

  private static toBloodline(doc: DBBloodline): Bloodline {
    return new Bloodline({
      name: doc.name,
      display: doc.display
    })
  }

  async findOneByName(name: string): Promise<Bloodline> {
    try {
      const bloodline = await this.dbBloodlineRepository.findOneByOrFail({ name: name })
      return DBBloodlineProvider.toBloodline(bloodline)
    } catch (error) {
      return undefined
    }
  }

  async findAll(): Promise<Bloodline[]> {
    const bloodlines = await this.dbBloodlineRepository.find()
    return bloodlines.sort((a, b) => a.name.localeCompare(b.name)).map(DBBloodlineProvider.toBloodline)
  }
}
