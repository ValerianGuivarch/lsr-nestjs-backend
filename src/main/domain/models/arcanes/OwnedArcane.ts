import { Arcane } from './Arcane'
import { ArcaneUse } from './ArcaneUse'

export class OwnedArcane {
  id: number
  arcane: Arcane
  use: ArcaneUse

  constructor(p: OwnedArcane) {
    this.id = p.id
    this.arcane = p.arcane
    this.use = p.use
  }
}
