import { ArcaneType } from './ArcaneType'

export class Arcane {
  name: string
  type: ArcaneType

  constructor(p: Arcane) {
    this.name = p.name
    this.type = p.type
  }
}
