import { DBBloodline } from './DBBloodline'
import { Bloodline } from '../../../domain/models/characters/Bloodline'
import { IBloodlineProvider } from '../../../domain/providers/IBloodlineProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
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
      healthImproved: doc.healthImproved
    })
  }

  private static fromBloodline(doc: Bloodline): DBBloodline {
    return {
      name: doc.name,
      detteByMagicAction: doc.detteByMagicAction,
      healthImproved: doc.healthImproved
    } as DBBloodline
  }

  async findOneByName(name: string): Promise<Bloodline> {
    const bloodline = await this.dbBloodlineRepository.findOneBy({ name: name })
    if (!bloodline) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return DBBloodlineProvider.toBloodline(bloodline)
  }
  async findAll(): Promise<Bloodline[]> {
    const bloodlines = await this.dbBloodlineRepository.find()
    return bloodlines.map(DBBloodlineProvider.toBloodline)
  }
}
