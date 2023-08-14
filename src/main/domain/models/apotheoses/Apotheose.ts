import { DisplayCategory } from '../characters/DisplayCategory'

export class Apotheose {
  name: string
  shortName: string
  minLevel: number
  maxLevel: number
  chairImprovement: number
  espritImprovement: number
  essenceImprovement: number
  arcaneImprovement: boolean
  avantage: boolean
  apotheoseEffect: string[]
  displayCategory: DisplayCategory
  position: number
  cost: number
  description?: string

  constructor(p: Apotheose) {
    this.name = p.name
    this.shortName = p.shortName
    this.minLevel = p.minLevel
    this.maxLevel = p.maxLevel
    this.chairImprovement = p.chairImprovement
    this.espritImprovement = p.espritImprovement
    this.essenceImprovement = p.essenceImprovement
    this.arcaneImprovement = p.arcaneImprovement
    this.avantage = p.avantage
    this.apotheoseEffect = p.apotheoseEffect
    this.displayCategory = p.displayCategory
    this.position = p.position
    this.cost = p.cost
    this.description = p.description
  }

  /*  NONE = 'NONE',
  NORMALE = 'NORMALE',
  IMPROVED = 'IMPROVED',
  FINALE = 'FINALE',
  ARCANIQUE = 'ARCANIQUE',
  FORME_VENGERESSE = 'FORME_VENGERESSE',
  SURCHARGE = 'SURCHARGE',
  SURCHARGE_IMPROVED = 'SURCHARGE_IMPROVED'*/
}
