import { ChaosLevel } from './ChaosLevel'

export class Session {
  chaos: ChaosLevel
  baseRest: number
  improvedRest: number
  owners: string[]
  fake: number
  entries: string
  speaking: string

  constructor(session: Session) {
    this.chaos = session.chaos
    this.baseRest = session.baseRest
    this.improvedRest = session.improvedRest
    this.owners = session.owners
    this.fake = session.fake
    this.entries = session.entries
    this.speaking = session.speaking
  }
}
