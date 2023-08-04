export class Classe {
  /*CHAMPION = 'CHAMPION',
  CORROMPU = 'CORROMPU',
  REJETE = 'REJETE',
  PACIFICATEUR = 'PACIFICATEUR',
  SPIRITE = 'SPIRITE',
  ARCANISTE = 'ARCANISTE',
  CHAMPION_ARCANIQUE = 'CHAMPION_ARCANIQUE',
  SOLDAT = 'SOLDAT',
  AVATAR = 'AVATAR',
  SKINWALKER = 'SKINWALKER',
  GAME_MASTER = 'GAME_MASTER',
  ROI = 'ROI',
  PAROLIER = 'PAROLIER',
  DRAGON = 'DRAGON',
  INCONNU = 'INCONNU'*/
  name: string
  displayMale: string
  displayFemale: string

  constructor(p: Classe) {
    this.name = p.name
    this.displayMale = p.displayMale
    this.displayFemale = p.displayFemale
  }
}
