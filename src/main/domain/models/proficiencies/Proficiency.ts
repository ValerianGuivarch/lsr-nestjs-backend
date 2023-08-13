import { DisplayCategory } from '../characters/DisplayCategory'

export class Proficiency {
  name: string
  shortName: string
  minLevel: number
  displayCategory: DisplayCategory

  constructor(p: Proficiency) {
    this.name = p.name
    this.shortName = p.shortName
    this.minLevel = p.minLevel
    this.displayCategory = p.displayCategory
  }
}
