import { Constellation } from './Constellation'
import { PlayState } from './PlayState'
import { Scenario } from './Scenario'

export class Joueuse {
  id: string
  name: string
  coins: number
  state: PlayState
  sponsor?: Constellation
  scenario?: Scenario

  constructor(p: {
    id: string
    name: string
    coins: number
    sponsor?: Constellation
    scenario?: Scenario
    state: PlayState
  }) {
    this.id = p.id
    this.name = p.name
    this.coins = p.coins
    this.sponsor = p.sponsor
    this.scenario = p.scenario
    this.state = p.state
  }

  static toJoueuseToCreate(p: { name: string }): JoueuseToCreate {
    return {
      name: p.name,
      coins: 0,
      state: PlayState.NOT_STARTED
    }
  }
}

export type JoueuseToCreate = Omit<Joueuse, 'id' | 'sponsor' | 'scenario'>
export type JoueuseToUpdate = Pick<Joueuse, 'coins'> & {
  scenarioId: string
  sponsorId: string
  state: PlayState
}
