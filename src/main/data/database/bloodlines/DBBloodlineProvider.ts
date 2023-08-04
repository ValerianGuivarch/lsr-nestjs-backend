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
      detteByMagicAction: doc.detteByMagicAction,
      healthImproved: doc.healthImproved,
      display: doc.display
    })
  }

  private static fromBloodline(doc: Bloodline): DBBloodline {
    return {
      name: doc.name,
      detteByMagicAction: doc.detteByMagicAction,
      healthImproved: doc.healthImproved,
      display: doc.display
    } as DBBloodline
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
    return bloodlines.map(DBBloodlineProvider.toBloodline)
  }
}
