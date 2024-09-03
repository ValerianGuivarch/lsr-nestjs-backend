export class Stat {
  id: string
  name: string
  color: string
  order: number
  flipText: string

  constructor(stat: { id: string; name: string; color: string; order: number; flipText: string }) {
    this.id = stat.id
    this.name = stat.name
    this.color = stat.color
    this.order = stat.order
    this.flipText = stat.flipText
  }
}
