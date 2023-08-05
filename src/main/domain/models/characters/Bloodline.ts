export class Bloodline {
  name: string
  detteByMagicAction: number
  detteByPp: number
  healthImproved: boolean
  display: string

  constructor(p: Bloodline) {
    this.name = p.name
    this.detteByMagicAction = p.detteByMagicAction
    this.detteByPp = p.detteByPp
    this.healthImproved = p.healthImproved
    this.display = p.display
  }
}
