export class Apotheose {
  name: string
  minLevel: number
  classes: string[]
  chairImprovement: number
  espritImprovement: number
  essenceImprovement: number
  arcaneImprovement: boolean

  constructor(p: Apotheose) {
    this.name = p.name
    this.minLevel = p.minLevel
    this.classes = p.classes
    this.chairImprovement = p.chairImprovement
    this.espritImprovement = p.espritImprovement
    this.essenceImprovement = p.essenceImprovement
    this.arcaneImprovement = p.arcaneImprovement
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
