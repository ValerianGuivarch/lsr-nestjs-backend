export class Bloodline {
  name: string
  detteByMagicAction: number
  healthImproved: boolean
  display: string

  constructor(p: Bloodline) {
    this.name = p.name
    this.detteByMagicAction = p.detteByMagicAction
    this.healthImproved = p.healthImproved
    this.display = p.display
  }
}
