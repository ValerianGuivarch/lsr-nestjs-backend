import { DBJoueuse, DBJoueuseToCreate } from './DBJoueuse'
import { Joueuse, JoueuseToCreate, JoueuseToUpdate } from '../../domain/models/elena/Joueuse'
import { IJoueuseProvider } from '../../domain/providers/elena/IJoueuseProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBJoueuseProvider implements IJoueuseProvider {
  private readonly logger = new Logger(DBJoueuse.name)
  constructor(
    @InjectRepository(DBJoueuse, 'postgres')
    private readonly joueuseRepository: Repository<DBJoueuse>
  ) {
    this.logger.log('Initialised')
  }

  async create(joueuse: JoueuseToCreate): Promise<Joueuse> {
    const toCreate: DBJoueuseToCreate = {
      name: joueuse.name,
      coins: joueuse.coins,
      state: joueuse.state,
      sponsorToChoose: joueuse.sponsorToChoose,
      sponsorId: null,
      scenarioId: null
    }
    const created = this.joueuseRepository.create(toCreate)
    await this.joueuseRepository.insert(created)
    return await this.findOneByName(joueuse.name)
  }

  async findOneByName(name: string): Promise<Joueuse> {
    const joueuse = await this.joueuseRepository.findOne({
      where: {
        name: name
      },
      relations: DBJoueuse.RELATIONS
    })
    if (!joueuse) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return DBJoueuse.toJoueuse(joueuse)
  }

  async findAll(): Promise<Joueuse[]> {
    const joueuses = await this.joueuseRepository.find({
      relations: DBJoueuse.RELATIONS
    })
    return joueuses.map(DBJoueuse.toJoueuse)
  }

  async update(p: { joueuseName: string; joueuse: Partial<JoueuseToUpdate> }): Promise<Joueuse> {
    const toUpdate: Partial<JoueuseToUpdate> = {
      coins: p.joueuse.coins,
      state: p.joueuse.state,
      sponsorId: p.joueuse.sponsorId,
      scenarioId: p.joueuse.scenarioId
    }
    await this.joueuseRepository.update(
      {
        name: p.joueuseName
      },
      toUpdate
    )
    return await this.findOneByName(p.joueuseName)
  }
}
