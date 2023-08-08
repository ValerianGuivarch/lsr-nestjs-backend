import { DisplayCategory } from '../characters/DisplayCategory'

export class Proficiency {
  name: string
  minLevel: number
  displayCategory: DisplayCategory

  constructor(p: Proficiency) {
    this.name = p.name
    this.minLevel = p.minLevel
    this.displayCategory = p.displayCategory
  }
}
