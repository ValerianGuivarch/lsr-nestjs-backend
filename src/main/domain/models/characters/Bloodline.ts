export class Bloodline {
  name: string
  detteByMagicAction: number
  healthImproved: boolean

  constructor(p: Bloodline) {
    this.name = p.name
    this.detteByMagicAction = p.detteByMagicAction
    this.healthImproved = p.healthImproved
  }
}
