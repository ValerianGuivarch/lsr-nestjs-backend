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
  sponsorToChoose: boolean

  constructor(p: {
    id: string
    name: string
    coins: number
    sponsor?: Constellation
    scenario?: Scenario
    sponsorToChoose: boolean
    state: PlayState
  }) {
    this.id = p.id
    this.name = p.name
    this.coins = p.coins
    this.sponsor = p.sponsor
    this.scenario = p.scenario
    this.state = p.state
    this.sponsorToChoose = false
  }

  static toJoueuseToCreate(p: { name: string }): JoueuseToCreate {
    return {
      name: p.name,
      coins: 0,
      state: PlayState.NOT_STARTED,
      sponsorToChoose: false
    }
  }
}

export type JoueuseToCreate = Omit<Joueuse, 'id' | 'sponsor' | 'scenario'>
export type JoueuseToUpdate = Pick<Joueuse, 'coins' | 'sponsorToChoose'> & {
  scenarioId: string
  sponsorId: string
  state: PlayState
}
