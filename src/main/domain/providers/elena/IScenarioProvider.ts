import { Scenario, ScenarioToCreate } from '../../models/elena/Scenario'

export interface IScenarioProvider {
  create(scenario: ScenarioToCreate): Promise<Scenario>
  findOneById(id: string): Promise<Scenario>
  findAll(): Promise<Scenario[]>
}
