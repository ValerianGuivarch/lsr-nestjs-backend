export class House {
  name: string
  points: number

  constructor(house: { name: string; points: number }) {
    this.name = house.name
    this.points = house.points
  }
}
