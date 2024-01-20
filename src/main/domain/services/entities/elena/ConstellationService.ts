import { Constellation, ConstellationToCreate } from '../../../models/elena/Constellation'
import { IConstellationProvider } from '../../../providers/elena/IConstellationProvider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class ConstellationService {
  constructor(@Inject('IConstellationProvider') private readonly constellationProvider: IConstellationProvider) {}

  async create(constellation: ConstellationToCreate): Promise<Constellation> {
    return await this.constellationProvider.create(constellation)
  }

  async findOneById(id: string): Promise<Constellation> {
    return await this.constellationProvider.findOneById(id)
  }

  async reveal(constellationId: string): Promise<Constellation> {
    return await this.constellationProvider.update({
      constellationId: constellationId,
      constellation: {
        revealed: true
      }
    })
  }

  async findAll(): Promise<Constellation[]> {
    return await this.constellationProvider.findAll()
  }
}
