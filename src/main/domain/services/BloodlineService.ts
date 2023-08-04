import { Bloodline } from '../models/characters/Bloodline'
import { IBloodlineProvider } from '../providers/IBloodlineProvider'
import { Inject, Logger } from '@nestjs/common'

export class BloodlineService {
  private readonly logger = new Logger(BloodlineService.name)
  @Inject('IBloodlineProvider')
  private bloodlineProvider: IBloodlineProvider

  constructor(
    @Inject('IBloodlineProvider')
    bloodlineProvider: IBloodlineProvider
  ) {
    this.bloodlineProvider = bloodlineProvider
    console.log('BloodlineService')
  }

  async findAll(): Promise<Bloodline[]> {
    return this.bloodlineProvider.findAll()
  }

  async findOneByName(name: string): Promise<Bloodline | undefined> {
    return this.bloodlineProvider.findOneByName(name)
  }
}
