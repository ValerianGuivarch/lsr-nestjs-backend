export class Stat {
  id: string
  name: string
  color: string

  constructor(stat: { id: string; name: string; color: string }) {
    this.id = stat.id
    this.name = stat.name
    this.color = stat.color
  }
}
