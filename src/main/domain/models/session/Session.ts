import { ChaosLevel } from './ChaosLevel'

export class Session {
  chaos: ChaosLevel
  baseRest: number
  improvedRest: number
  owners: string[]
  fake: number

  constructor(session: Session) {
    this.chaos = session.chaos
    this.baseRest = session.baseRest
    this.improvedRest = session.improvedRest
    this.owners = session.owners
    this.fake = session.fake
  }
}
