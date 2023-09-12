export class Classe {
  name: string
  displayMale: string
  displayFemale: string
  canUsePp: boolean

  constructor(p: Classe) {
    this.name = p.name
    this.displayMale = p.displayMale
    this.displayFemale = p.displayFemale
    this.canUsePp = p.canUsePp
  }
}
