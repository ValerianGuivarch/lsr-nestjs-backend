import { Scenario, ScenarioToCreate } from '../../../models/elena/Scenario'
import { IScenarioProvider } from '../../../providers/elena/IScenarioProvider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class ScenarioService {
  constructor(@Inject('IScenarioProvider') private readonly scenarioProvider: IScenarioProvider) {}

  async create(scenario: ScenarioToCreate): Promise<Scenario> {
    return await this.scenarioProvider.create(scenario)
  }

  async findOneById(id: string): Promise<Scenario> {
    return await this.scenarioProvider.findOneById(id)
  }

  async findAll(): Promise<Scenario[]> {
    return await this.scenarioProvider.findAll()
  }
}
