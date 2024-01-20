import { ConstellationVM, ConstellationVMExample } from './ConstellationVM'
import { ScenarioVM, ScenarioVMExample } from './ScenarioVM'
import { Constellation } from '../../../../../../domain/models/elena/Constellation'
import { Joueuse } from '../../../../../../domain/models/elena/Joueuse'
import { PlayState } from '../../../../../../domain/models/elena/PlayState'
import { Scenario } from '../../../../../../domain/models/elena/Scenario'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class JoueuseVM {
  @ApiProperty({
    description: 'The joueuse id',
    type: String
  })
  id: string

  @ApiProperty({
    description: 'The joueuse name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The joueuse coins',
    type: Number
  })
  coins: number

  @ApiPropertyOptional({
    description: 'The joueuse sponsor',
    type: ConstellationVM
  })
  sponsor?: ConstellationVM

  @ApiPropertyOptional({
    description: 'The joueuse scenario',
    type: ScenarioVM
  })
  scenario?: ScenarioVM

  state: PlayState

  sponsorChoices?: {
    id: string
    name: string
  }[]

  scenarioChoices?: {
    id: string
    name: string
  }[]

  constructor(joueuse: JoueuseVM) {
    this.id = joueuse.id
    this.name = joueuse.name
    this.coins = joueuse.coins
    this.sponsor = joueuse.sponsor
    this.scenario = joueuse.scenario
    this.sponsorChoices = joueuse.sponsorChoices
    this.scenarioChoices = joueuse.scenarioChoices
    this.state = joueuse.state
  }

  static fromJoueuse(joueuse: Joueuse, sponsorChoices: Constellation[], scenarioChoices: Scenario[]): JoueuseVM {
    return new JoueuseVM({
      id: joueuse.id,
      name: joueuse.name,
      coins: joueuse.coins,
      state: joueuse.state,
      sponsor: joueuse.sponsor === null ? null : ConstellationVM.fromConstellation(joueuse.sponsor),
      scenario: joueuse.scenario === null ? null : ScenarioVM.fromScenario(joueuse.scenario),
      sponsorChoices: sponsorChoices.map((sponsor) => {
        return {
          id: sponsor.id,
          name: sponsor.name
        }
      }),
      scenarioChoices: scenarioChoices.map((scenario) => {
        return {
          id: scenario.id,
          name: scenario.name
        }
      })
    })
  }
}

export const JoueuseVMExample: JoueuseVM = {
  id: '1',
  name: 'Joueuse',
  coins: 0,
  sponsor: ConstellationVMExample,
  scenario: ScenarioVMExample,
  state: PlayState.NOT_STARTED
}
