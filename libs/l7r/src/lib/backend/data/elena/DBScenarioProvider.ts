import { DBScenario, DBScenarioToCreate } from './DBScenario'
import { Scenario, ScenarioToCreate } from '../../domain/models/elena/Scenario'
import { IScenarioProvider } from '../../domain/providers/elena/IScenarioProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBScenarioProvider implements IScenarioProvider {
  private readonly logger = new Logger(DBScenario.name)
  constructor(
    @InjectRepository(DBScenario, 'postgres')
    private readonly scenarioRepository: Repository<DBScenario>
  ) {
    this.logger.log('Initialised')
  }

  async create(scenario: ScenarioToCreate): Promise<Scenario> {
    const toCreate: DBScenarioToCreate = {
      name: scenario.name,
      difficulty: scenario.difficulty,
      victory: scenario.victory,
      defeat: scenario.defeat,
      time: scenario.time,
      reward: scenario.reward,
      rewardCoin: scenario.rewardCoin,
      text: scenario.text,
      victoryMsg: scenario.victoryMsg,
      defaiteMsg: scenario.defaiteMsg
    }
    const created = this.scenarioRepository.create(toCreate)
    await this.scenarioRepository.insert(created)
    return await this.findOneById(created.id)
  }

  async findOneById(id: string): Promise<Scenario> {
    const scenario = await this.scenarioRepository.findOne({
      where: {
        id: id
      },
      relations: DBScenario.RELATIONS
    })
    if (!scenario) {
      throw ProviderErrors.EntityNotFound(DBScenario.name)
    }
    return DBScenario.toScenario(scenario)
  }

  async findAll(): Promise<Scenario[]> {
    const scenarios = await this.scenarioRepository.find({
      relations: DBScenario.RELATIONS
    })
    return scenarios.map(DBScenario.toScenario)
  }
}
