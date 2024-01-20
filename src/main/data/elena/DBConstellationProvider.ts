import { DBConstellation, DBConstellationToCreate } from './DBConstellation'
import { Constellation, ConstellationToCreate } from '../../domain/models/elena/Constellation'
import { IConstellationProvider } from '../../domain/providers/elena/IConstellationProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBConstellationProvider implements IConstellationProvider {
  private readonly logger = new Logger(DBConstellation.name)
  constructor(
    @InjectRepository(DBConstellation, 'postgres')
    private readonly constellationRepository: Repository<DBConstellation>
  ) {
    this.logger.log('Initialised')
  }

  async create(constellation: ConstellationToCreate): Promise<Constellation> {
    const toCreate: DBConstellationToCreate = {
      name: constellation.name,
      realName: constellation.realName,
      pictureUrl: constellation.pictureUrl,
      pictureUrlRevealed: constellation.pictureUrlRevealed,
      revealed: constellation.revealed,
      isStarStream: constellation.isStarStream,
      sponsor: constellation.sponsor
    }
    const created = this.constellationRepository.create(toCreate)
    await this.constellationRepository.insert(created)
    return await this.findOneById(created.id)
  }

  async findOneById(id: string): Promise<Constellation> {
    const constellation = await this.constellationRepository.findOne({
      where: {
        id: id
      },
      relations: DBConstellation.RELATIONS
    })
    if (!constellation) {
      throw ProviderErrors.EntityNotFound(DBConstellation.name)
    }
    return DBConstellation.toConstellation(constellation)
  }

  async findAll(): Promise<Constellation[]> {
    const constellations = await this.constellationRepository.find({
      relations: DBConstellation.RELATIONS
    })
    return constellations.map(DBConstellation.toConstellation)
  }

  async update(p: { constellationId: string; constellation: Partial<Constellation> }): Promise<Constellation> {
    const toUpdate = await this.constellationRepository.findOne({
      where: {
        id: p.constellationId
      }
    })
    if (!toUpdate) {
      throw ProviderErrors.EntityNotFound(DBConstellation.name)
    }
    const updated = this.constellationRepository.merge(toUpdate, p.constellation)
    await this.constellationRepository.update(p.constellationId, updated)
    return await this.findOneById(p.constellationId)
  }
}
