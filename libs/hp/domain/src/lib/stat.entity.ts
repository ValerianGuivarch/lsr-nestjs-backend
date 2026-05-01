export class Stat {
  name: string
  order: number
  flipText: string

  constructor(stat: { name: string; order: number; flipText: string }) {
    this.name = stat.name
    this.order = stat.order
    this.flipText = stat.flipText
  }
}
